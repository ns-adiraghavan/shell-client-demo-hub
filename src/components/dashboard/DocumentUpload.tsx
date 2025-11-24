import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DocumentUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const isValid = file.size <= 20 * 1024 * 1024; // 20MB limit
      if (!isValid) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 20MB limit`,
          variant: "destructive"
        });
      }
      return isValid;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[files[index].name];
      return newStatus;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload documents",
        variant: "destructive"
      });
      setUploading(false);
      return;
    }

    for (const file of files) {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'pending' }));

        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('research-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('uploaded_documents')
          .insert({
            user_id: user.id,
            filename: file.name,
            storage_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            status: 'uploaded'
          });

        if (dbError) throw dbError;

        setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setUploading(false);
    
    const successCount = Object.values(uploadStatus).filter(s => s === 'success').length;
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} document(s)`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Research Documents
        </CardTitle>
        <CardDescription>
          Upload PDFs, Word docs, or other research materials for RAG processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.pptx,.xlsx"
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, TXT, PPTX, XLSX (Max 20MB per file)
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Files ({files.length})</p>
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {uploadStatus[file.name] === 'success' && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  {uploadStatus[file.name] === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
        </Button>
      </CardContent>
    </Card>
  );
};
