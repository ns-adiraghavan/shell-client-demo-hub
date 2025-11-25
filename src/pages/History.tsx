import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchHeader } from "@/components/dashboard/SearchHeader";
import { History as HistoryIcon, Search, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SavedSearch {
  id: string;
  query: string;
  sources: any;
  max_results: number;
  results: any;
  synthesis: string;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [filteredSearches, setFilteredSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadSearches();
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadSearches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSearches(data || []);
      setFilteredSearches(data || []);
    } catch (error) {
      console.error("Error loading searches:", error);
      toast.error("Failed to load search history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (filterQuery) {
      const filtered = searches.filter(search =>
        search.query.toLowerCase().includes(filterQuery.toLowerCase())
      );
      setFilteredSearches(filtered);
    } else {
      setFilteredSearches(searches);
    }
  }, [filterQuery, searches]);

  const handleRerun = (search: SavedSearch) => {
    navigate("/", {
      state: {
        query: search.query,
        sources: search.sources,
        maxResults: search.max_results
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Search deleted");
      loadSearches();
    } catch (error) {
      console.error("Error deleting search:", error);
      toast.error("Failed to delete search");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <HistoryIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Search History</h1>
            <p className="text-muted-foreground">View and manage your saved searches</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter searches..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </>
          ) : filteredSearches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {filterQuery ? "No searches match your filter" : "No saved searches yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSearches.map((search) => (
              <Card key={search.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{search.query}</CardTitle>
                      <CardDescription>
                        {format(new Date(search.created_at), "PPpp")}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(search.sources).map(([source, enabled]) =>
                          enabled ? (
                            <Badge key={source} variant="secondary">
                              {source}
                            </Badge>
                          ) : null
                        )}
                        <Badge variant="outline">
                          {search.results?.length || 0} results
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRerun(search)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Re-run
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(search.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {search.synthesis && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {search.synthesis}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
