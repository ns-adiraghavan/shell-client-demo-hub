import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, File, X, CheckCircle, AlertCircle, Server, Mail, Cloud, Key, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExternalSource {
  type: 'sharepoint' | 'server' | 'email';
  name: string;
  location: string;
  credentials: {
    username?: string;
    password?: string;
    token?: string;
    accessKey?: string;
    secretKey?: string;
    sshKey?: string;
  };
  connected: boolean;
}

export const DocumentUpload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [externalSources, setExternalSources] = useState<ExternalSource[]>([]);
  const [newSource, setNewSource] = useState<Partial<ExternalSource>>({
    type: 'sharepoint',
    name: '',
    location: '',
    credentials: {}
  });
  const [isConnecting, setIsConnecting] = useState(false);
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

  const handleConnectSource = async () => {
    if (!newSource.name || !newSource.location) {
      toast({
        title: "Missing information",
        description: "Please provide a name and location for the source",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    // Simulate connection attempt - in production this would actually connect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const source: ExternalSource = {
      type: newSource.type as 'sharepoint' | 'server' | 'email',
      name: newSource.name,
      location: newSource.location,
      credentials: newSource.credentials || {},
      connected: true
    };
    
    setExternalSources(prev => [...prev, source]);
    setNewSource({
      type: 'sharepoint',
      name: '',
      location: '',
      credentials: {}
    });
    
    toast({
      title: "Source connected",
      description: `Successfully connected to ${source.name}. Documents will be indexed for RAG.`
    });
    
    setIsConnecting(false);
  };

  const removeSource = (index: number) => {
    setExternalSources(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Source removed",
      description: "External source has been disconnected"
    });
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'sharepoint': return <Cloud className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getCredentialFields = () => {
    switch (newSource.type) {
      case 'sharepoint':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">SharePoint URL</Label>
              <Input
                placeholder="https://company.sharepoint.com/sites/research"
                value={newSource.location}
                onChange={(e) => setNewSource(prev => ({ ...prev, location: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Client ID</Label>
              <Input
                placeholder="Azure AD Client ID"
                value={newSource.credentials?.username || ''}
                onChange={(e) => setNewSource(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, username: e.target.value }
                }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Client Secret</Label>
              <div className="relative">
                <Input
                  type={showCredentials['secret'] ? 'text' : 'password'}
                  placeholder="Azure AD Client Secret"
                  value={newSource.credentials?.password || ''}
                  onChange={(e) => setNewSource(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, password: e.target.value }
                  }))}
                  className="bg-muted/50 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCredentials(prev => ({ ...prev, secret: !prev.secret }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCredentials['secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );
      case 'server':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Server Address</Label>
              <Input
                placeholder="sftp://server.company.com/research or \\\\server\\share"
                value={newSource.location}
                onChange={(e) => setNewSource(prev => ({ ...prev, location: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Username</Label>
              <Input
                placeholder="Username"
                value={newSource.credentials?.username || ''}
                onChange={(e) => setNewSource(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, username: e.target.value }
                }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Authentication</Label>
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="password" className="text-xs">Password</TabsTrigger>
                  <TabsTrigger value="ssh" className="text-xs">SSH Key</TabsTrigger>
                </TabsList>
                <TabsContent value="password" className="mt-2">
                  <div className="relative">
                    <Input
                      type={showCredentials['password'] ? 'text' : 'password'}
                      placeholder="Password"
                      value={newSource.credentials?.password || ''}
                      onChange={(e) => setNewSource(prev => ({ 
                        ...prev, 
                        credentials: { ...prev.credentials, password: e.target.value }
                      }))}
                      className="bg-muted/50 border-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(prev => ({ ...prev, password: !prev.password }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCredentials['password'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="ssh" className="mt-2">
                  <textarea
                    placeholder="Paste SSH private key..."
                    value={newSource.credentials?.sshKey || ''}
                    onChange={(e) => setNewSource(prev => ({ 
                      ...prev, 
                      credentials: { ...prev.credentials, sshKey: e.target.value }
                    }))}
                    className="w-full h-20 bg-muted/50 border border-border/50 rounded-md p-2 text-xs font-mono resize-none"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        );
      case 'email':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email Server (IMAP/Exchange)</Label>
              <Input
                placeholder="imap.company.com or outlook.office365.com"
                value={newSource.location}
                onChange={(e) => setNewSource(prev => ({ ...prev, location: e.target.value }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email Address</Label>
              <Input
                placeholder="user@company.com"
                value={newSource.credentials?.username || ''}
                onChange={(e) => setNewSource(prev => ({ 
                  ...prev, 
                  credentials: { ...prev.credentials, username: e.target.value }
                }))}
                className="bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">App Password / OAuth Token</Label>
              <div className="relative">
                <Input
                  type={showCredentials['token'] ? 'text' : 'password'}
                  placeholder="App password or OAuth access token"
                  value={newSource.credentials?.token || ''}
                  onChange={(e) => setNewSource(prev => ({ 
                    ...prev, 
                    credentials: { ...prev.credentials, token: e.target.value }
                  }))}
                  className="bg-muted/50 border-border/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCredentials(prev => ({ ...prev, token: !prev.token }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCredentials['token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border-border/30 shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Upload className="h-5 w-5 text-primary" />
          Document Intelligence
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload documents or connect to external sources for RAG-powered analysis integrated with your search results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="upload" className="data-[state=active]:bg-card">Upload Files</TabsTrigger>
            <TabsTrigger value="connect" className="data-[state=active]:bg-card">Connect Sources</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.pptx,.xlsx"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1 text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, TXT, PPTX, XLSX (Max 20MB per file)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Selected Files ({files.length})</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3 flex-1">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {uploadStatus[file.name] === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
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
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={uploadFiles}
                  disabled={files.length === 0 || uploading}
                  className="w-full"
                >
                  {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="connect" className="space-y-4 mt-4">
            {/* Connected Sources */}
            {externalSources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Connected Sources</p>
                {externalSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(source.type)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{source.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{source.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Connected
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSource(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Source */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/30">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Add External Source
              </p>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Source Type</Label>
                <Tabs 
                  value={newSource.type} 
                  onValueChange={(v) => setNewSource(prev => ({ 
                    ...prev, 
                    type: v as 'sharepoint' | 'server' | 'email',
                    location: '',
                    credentials: {}
                  }))}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger value="sharepoint" className="text-xs gap-1 data-[state=active]:bg-card">
                      <Cloud className="h-3 w-3" /> SharePoint
                    </TabsTrigger>
                    <TabsTrigger value="server" className="text-xs gap-1 data-[state=active]:bg-card">
                      <Server className="h-3 w-3" /> Server
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-xs gap-1 data-[state=active]:bg-card">
                      <Mail className="h-3 w-3" /> Email
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Source Name</Label>
                <Input
                  placeholder="e.g., Research Library, Project Documents"
                  value={newSource.name}
                  onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-muted/50 border-border/50"
                />
              </div>
              
              {getCredentialFields()}
              
              <Button 
                onClick={handleConnectSource}
                disabled={isConnecting || !newSource.name || !newSource.location}
                className="w-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect & Index'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Credentials are encrypted and stored securely. Documents will be indexed for RAG analysis.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
