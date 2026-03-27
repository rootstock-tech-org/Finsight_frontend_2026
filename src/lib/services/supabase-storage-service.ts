import { supabase } from '../supabase'

// Storage errors have a different structure than PostgrestError
interface StorageError {
  message: string
  statusCode?: string
  error?: string
}

export interface FileUploadResult {
  path: string
  url: string
  size: number
  mimeType: string
}

export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

export class SupabaseStorageService {
  private bucketName = 'finsight-files'

  // Upload a file to Supabase Storage
  async uploadFile(
    file: File,
    path: string,
    metadata?: Record<string, any>
  ): Promise<{ data: FileUploadResult | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        return { data: null, error }
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path)

        const result: FileUploadResult = {
          path: data.path,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.type,
        }

        return { data: result, error: null }
      }

      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    basePath: string,
    metadata?: Record<string, any>
  ): Promise<{ data: FileUploadResult[] | null; error: StorageError | null }> {
    try {
      const uploadPromises = files.map((file, index) => {
        const fileName = `${Date.now()}-${index}-${file.name}`
        const filePath = `${basePath}/${fileName}`
        return this.uploadFile(file, filePath, metadata)
      })

      const results = await Promise.all(uploadPromises)
      const errors = results.filter(result => result.error)
      const successfulUploads = results.filter(result => result.data)

      if (errors.length > 0) {
        // Return first error if any uploads failed
        return { data: null, error: errors[0].error }
      }

      const uploadedFiles = successfulUploads
        .map(result => result.data)
        .filter((data): data is FileUploadResult => data !== null)

      return { data: uploadedFiles, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }

  // Download a file
  async downloadFile(path: string): Promise<{ data: Blob | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(path)

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }

  // Get public URL for a file
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path)

    return data.publicUrl
  }

  // List files in a folder
  async listFiles(folderPath: string = ''): Promise<{ data: StorageFile[] | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(folderPath, {
          limit: 100,
          offset: 0,
        })

      if (error) {
        return { data: null, error }
      }

      const files: StorageFile[] = (data || []).map((item: any) => ({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata || {},
      }))

      return { data: files, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }

  // Delete a file
  async deleteFile(path: string): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path])

      return { error }
    } catch (error) {
      return { error: error as StorageError }
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(paths: string[]): Promise<{ error: StorageError | null }> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove(paths)

      return { error }
    } catch (error) {
      return { error: error as StorageError }
    }
  }

  // Update file metadata
  async updateFileMetadata(
    path: string,
    metadata: Record<string, any>
  ): Promise<{ error: StorageError | null }> {
    try {
      // Note: Supabase storage update doesn't support metadata in current version
      // This is a placeholder for future implementation
      console.warn('updateFileMetadata: metadata update not supported in current Supabase version')
      return { error: null }
    } catch (error) {
      return { error: error as StorageError }
    }
  }

  // Move/Rename a file
  async moveFile(
    oldPath: string,
    newPath: string
  ): Promise<{ error: StorageError | null }> {
    try {
      // Download the file
      const { data: fileData, error: downloadError } = await this.downloadFile(oldPath)
      if (downloadError || !fileData) {
        return { error: downloadError }
      }

      // Upload to new path
      const file = new File([fileData], newPath.split('/').pop() || 'file', {
        type: fileData.type,
      })
      const { error: uploadError } = await this.uploadFile(file, newPath)
      if (uploadError) {
        return { error: uploadError }
      }

      // Delete old file
      const { error: deleteError } = await this.deleteFile(oldPath)
      return { error: deleteError }
    } catch (error) {
      return { error: error as StorageError }
    }
  }

  // Get file size
  async getFileSize(path: string): Promise<{ data: number | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(path.split('/').slice(0, -1).join('/'))

      if (error) {
        return { data: null, error }
      }

      const file = data?.find((item: any) => item.name === path.split('/').pop())
      return { data: file?.metadata?.size || null, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }

  // Check if file exists
  async fileExists(path: string): Promise<{ data: boolean | null; error: StorageError | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(path.split('/').slice(0, -1).join('/'))

      if (error) {
        return { data: null, error }
      }

      const exists = data?.some((item: any) => item.name === path.split('/').pop())
      return { data: exists || false, error: null }
    } catch (error) {
      return { data: null, error: error as StorageError }
    }
  }
}

// Export singleton instance
export const supabaseStorageService = new SupabaseStorageService()
