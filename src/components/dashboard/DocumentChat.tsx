import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, FileText, Loader2, Sparkles, ListChecks, GitCompare, BarChart3, Trash2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Document {
  id: string;
  filename: string;
  storage_path?: string;
}

export const DocumentChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>("all");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [keyFindings, setKeyFindings] = useState("");
  const [comparison, setComparison] = useState("");
  const [metaAnalysis, setMetaAnalysis] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('uploaded_documents')
      .select('id, filename, storage_path')
      .eq('status', 'uploaded')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const deleteDocument = async (docId: string, storagePath?: string) => {
    setIsDeleting(true);
    try {
      // Delete from storage if path exists
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('research-documents')
          .remove([storagePath]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('uploaded_documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
      if (selectedDocument === docId) {
        setSelectedDocument("all");
      }
      
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: { 
          message: input,
          documentId: selectedDocument === "all" ? null : selectedDocument,
          conversationHistory: messages,
          mode: 'chat'
        }
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.response || "I couldn't generate a response."
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error chatting with documents:', error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    if (selectedDocument === "all" && documents.length === 0) {
      toast.error("No documents available");
      return;
    }

    setIsLoading(true);
    setSummary("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: { 
          documentId: selectedDocument === "all" ? null : selectedDocument,
          mode: 'summarize'
        }
      });

      if (error) throw error;
      setSummary(data.response || "Could not generate summary.");
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error("Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  const extractKeyFindings = async () => {
    if (selectedDocument === "all" && documents.length === 0) {
      toast.error("No documents available");
      return;
    }

    setIsLoading(true);
    setKeyFindings("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: { 
          documentId: selectedDocument === "all" ? null : selectedDocument,
          mode: 'key-findings'
        }
      });

      if (error) throw error;
      setKeyFindings(data.response || "Could not extract key findings.");
      toast.success("Key findings extracted");
    } catch (error) {
      console.error('Error extracting key findings:', error);
      toast.error("Failed to extract key findings");
    } finally {
      setIsLoading(false);
    }
  };

  const compareDocuments = async () => {
    if (selectedDocuments.length < 2) {
      toast.error("Select at least 2 documents to compare");
      return;
    }

    setIsLoading(true);
    setComparison("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: { 
          documentIds: selectedDocuments,
          mode: 'compare'
        }
      });

      if (error) throw error;
      setComparison(data.response || "Could not generate comparison.");
      toast.success("Comparison generated");
    } catch (error) {
      console.error('Error comparing documents:', error);
      toast.error("Failed to compare documents");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(documents.map(doc => doc.id));
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  const generateMetaAnalysis = async () => {
    if (selectedDocuments.length < 2) {
      toast.error("Select at least 2 documents for meta-analysis");
      return;
    }

    setIsLoading(true);
    setMetaAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-documents', {
        body: { 
          documentIds: selectedDocuments,
          mode: 'meta-analysis'
        }
      });

      if (error) throw error;
      setMetaAnalysis(data.response || "Could not generate meta-analysis.");
      toast.success("Meta-analysis report generated");
    } catch (error) {
      console.error('Error generating meta-analysis:', error);
      toast.error("Failed to generate meta-analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document AI Assistant
            </CardTitle>
            <CardDescription>
              Chat, summarize, and analyze your research papers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {documents.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Document Management Section */}
        {documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Uploaded Documents:</p>
            <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/30">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm truncate flex-1">{doc.filename}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{doc.filename}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDocument(doc.id, doc.storage_path)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="summarize" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Summarize
            </TabsTrigger>
            <TabsTrigger value="findings" className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              Findings
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-1">
              <GitCompare className="h-3 w-3" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="meta-analysis" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Meta-Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col gap-4 mt-4">
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="Select document scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documents.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Start asking questions about your documents</p>
                    <p className="text-sm mt-1">I&apos;ll help you understand and analyze the research</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the documents..."
                disabled={isLoading || documents.length === 0}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || documents.length === 0}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="summarize" className="flex-1 flex flex-col gap-4 mt-4">
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="Select document to summarize" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documents.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={generateSummary} disabled={isLoading || documents.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>

            {summary && (
              <ScrollArea className="flex-1 pr-4">
                <div className="bg-muted rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                      p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="findings" className="flex-1 flex flex-col gap-4 mt-4">
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger>
                <SelectValue placeholder="Select document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documents.map(doc => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.filename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={extractKeyFindings} disabled={isLoading || documents.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <ListChecks className="h-4 w-4 mr-2" />
                  Extract Key Findings
                </>
              )}
            </Button>

            {keyFindings && (
              <ScrollArea className="flex-1 pr-4">
                <div className="bg-muted rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                  <h4 className="font-semibold mb-2">Key Findings</h4>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                      p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    }}
                  >
                    {keyFindings}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="compare" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Select documents to compare:</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllDocuments}
                    disabled={documents.length === 0}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearDocumentSelection}
                    disabled={selectedDocuments.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-32 border rounded-md p-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={doc.id}
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                    />
                    <label
                      htmlFor={doc.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {doc.filename}
                    </label>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <Button 
              onClick={compareDocuments} 
              disabled={isLoading || selectedDocuments.length < 2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                <>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Selected ({selectedDocuments.length})
                </>
              )}
            </Button>

            {comparison && (
              <ScrollArea className="flex-1 pr-4">
                <div className="bg-muted rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                  <h4 className="font-semibold mb-2">Comparative Analysis</h4>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                      p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    }}
                  >
                    {comparison}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="meta-analysis" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Select documents for batch analysis:</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllDocuments}
                    disabled={documents.length === 0}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearDocumentSelection}
                    disabled={selectedDocuments.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-32 border rounded-md p-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`meta-${doc.id}`}
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                    />
                    <label
                      htmlFor={`meta-${doc.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {doc.filename}
                    </label>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <Button 
              onClick={generateMetaAnalysis} 
              disabled={isLoading || selectedDocuments.length < 2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Meta-Analysis ({selectedDocuments.length})
                </>
              )}
            </Button>

            {metaAnalysis && (
              <ScrollArea className="flex-1 pr-4">
                <div className="bg-muted rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                  <h4 className="font-semibold mb-2">Meta-Analysis Report</h4>
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="text-base font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>,
                      p: ({ children }) => <p className="text-sm leading-relaxed mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                    }}
                  >
                    {metaAnalysis}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
        
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Upload documents first to use AI features
          </p>
        )}
      </CardContent>
    </Card>
  );
};