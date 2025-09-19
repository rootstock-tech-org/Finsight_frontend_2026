-- OCR Document Analysis Schema for Supabase
-- This schema stores document analysis results from the GinniAI OCR API

-- Create document_analysis table
CREATE TABLE IF NOT EXISTS document_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id TEXT UNIQUE, -- External API document ID
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'image', etc.
    company_name TEXT,
    document_type TEXT CHECK (document_type IN ('AR', 'SHL', 'IR', 'BRK', 'DIV', 'DRHP', 'OTH')),
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    analysis_data JSONB, -- Full analysis results
    metadata JSONB, -- Processing metadata
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create document_analysis_search table for search functionality
CREATE TABLE IF NOT EXISTS document_analysis_search (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results JSONB, -- Search results from OCR API
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_analysis_files table for file storage metadata
CREATE TABLE IF NOT EXISTS document_analysis_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID REFERENCES document_analysis(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- Path to stored file
    file_url TEXT, -- Public URL if stored in Supabase Storage
    file_hash TEXT, -- For deduplication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_analysis_user_id ON document_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_status ON document_analysis(status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_company_name ON document_analysis(company_name);
CREATE INDEX IF NOT EXISTS idx_document_analysis_document_type ON document_analysis(document_type);
CREATE INDEX IF NOT EXISTS idx_document_analysis_created_at ON document_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_analysis_document_id ON document_analysis(document_id);

CREATE INDEX IF NOT EXISTS idx_document_analysis_search_user_id ON document_analysis_search(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_search_created_at ON document_analysis_search(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_analysis_files_analysis_id ON document_analysis_files(analysis_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_files_file_hash ON document_analysis_files(file_hash);

-- Create GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_document_analysis_analysis_data_gin ON document_analysis USING GIN (analysis_data);
CREATE INDEX IF NOT EXISTS idx_document_analysis_metadata_gin ON document_analysis USING GIN (metadata);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_document_analysis_updated_at 
    BEFORE UPDATE ON document_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_search ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own document analyses
CREATE POLICY "Users can view their own document analyses" ON document_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document analyses" ON document_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document analyses" ON document_analysis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document analyses" ON document_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can only see their own search history
CREATE POLICY "Users can view their own search history" ON document_analysis_search
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON document_analysis_search
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON document_analysis_search
    FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can only see files for their own analyses
CREATE POLICY "Users can view their own analysis files" ON document_analysis_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM document_analysis 
            WHERE document_analysis.id = document_analysis_files.analysis_id 
            AND document_analysis.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert files for their own analyses" ON document_analysis_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM document_analysis 
            WHERE document_analysis.id = document_analysis_files.analysis_id 
            AND document_analysis.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete files for their own analyses" ON document_analysis_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM document_analysis 
            WHERE document_analysis.id = document_analysis_files.analysis_id 
            AND document_analysis.user_id = auth.uid()
        )
    );

-- Create function to get analysis statistics
CREATE OR REPLACE FUNCTION get_document_analysis_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_analyses', COUNT(*),
        'completed_analyses', COUNT(*) FILTER (WHERE status = 'completed'),
        'processing_analyses', COUNT(*) FILTER (WHERE status = 'processing'),
        'failed_analyses', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_file_size', COALESCE(SUM(file_size), 0),
        'document_types', json_object_agg(
            COALESCE(document_type, 'Unknown'), 
            type_count
        ),
        'recent_analyses', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'file_name', file_name,
                    'company_name', company_name,
                    'document_type', document_type,
                    'status', status,
                    'created_at', created_at
                )
            )
            FROM document_analysis
            WHERE user_id = user_uuid
            ORDER BY created_at DESC
            LIMIT 5
        )
    ) INTO stats
    FROM (
        SELECT 
            document_type,
            COUNT(*) as type_count
        FROM document_analysis
        WHERE user_id = user_uuid
        GROUP BY document_type
    ) type_counts
    RIGHT JOIN document_analysis ON true
    WHERE document_analysis.user_id = user_uuid;
    
    RETURN COALESCE(stats, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search analyses
CREATE OR REPLACE FUNCTION search_document_analyses(
    user_uuid UUID,
    search_query TEXT,
    limit_count INTEGER DEFAULT 10,
    offset_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    results JSON;
BEGIN
    SELECT json_build_object(
        'results', json_agg(
            json_build_object(
                'id', id,
                'file_name', file_name,
                'company_name', company_name,
                'document_type', document_type,
                'status', status,
                'created_at', created_at,
                'relevance_score', 1.0 -- Placeholder for relevance scoring
            )
        ),
        'total', COUNT(*)
    ) INTO results
    FROM document_analysis
    WHERE user_id = user_uuid
    AND (
        file_name ILIKE '%' || search_query || '%'
        OR company_name ILIKE '%' || search_query || '%'
        OR analysis_data::text ILIKE '%' || search_query || '%'
    )
    ORDER BY created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
    
    RETURN COALESCE(results, '{"results": [], "total": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON document_analysis TO authenticated;
GRANT ALL ON document_analysis_search TO authenticated;
GRANT ALL ON document_analysis_files TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_analysis_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_analyses(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Insert sample document types for reference
INSERT INTO document_analysis (user_id, file_name, file_size, file_type, company_name, document_type, status, analysis_data, metadata)
VALUES 
    (auth.uid(), 'sample_annual_report.pdf', 1024000, 'pdf', 'Sample Company', 'AR', 'completed', 
     '{"insights": {"financial_highlights": {"revenue": 1000000, "profit": 100000, "growth_rate": 10.5}}}'::jsonb,
     '{"pages_processed": 50, "processing_time": 30, "confidence_score": 0.95}'::jsonb)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE document_analysis IS 'Stores document analysis results from OCR API';
COMMENT ON TABLE document_analysis_search IS 'Stores search history for document analyses';
COMMENT ON TABLE document_analysis_files IS 'Stores file metadata for document analyses';
COMMENT ON FUNCTION get_document_analysis_stats(UUID) IS 'Returns statistics for a user''s document analyses';
COMMENT ON FUNCTION search_document_analyses(UUID, TEXT, INTEGER, INTEGER) IS 'Searches through a user''s document analyses';


