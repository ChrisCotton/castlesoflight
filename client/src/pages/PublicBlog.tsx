import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ChevronRight, FileText, Calendar, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicBlog() {
  const { data: posts = [], isLoading } = trpc.blog.listPublished.useQuery();

  return (
    <div className="container py-24 relative min-h-screen">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-16">
          <div className="sys-online mb-4">ENGINE STATUS: BROADCASTING</div>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-foreground mb-6">
            Infrastructure <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl">
            Deep-dives into AI-augmented DevOps, cloud cost engineering, and deployment velocity.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 w-full bg-secondary/10 animate-pulse rounded-xl border border-border/20" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-secondary/5 rounded-2xl border border-dashed border-border/40">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">The archives are currently being compiled. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="bg-secondary/10 border-border/40 hover:border-primary/40 transition-all duration-500 group cursor-pointer overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                    style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-3 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 text-primary">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.publishedAt || post.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        {post.viewCount} VIEWS
                      </span>
                    </div>
                    <CardTitle className="font-display font-bold text-2xl group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.description || "Click to read the full technical deep-dive."}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="pt-0 flex items-center text-primary text-sm font-bold tracking-widest uppercase gap-2 group-hover:translate-x-1 transition-transform">
                    Read Report <ArrowRight className="w-4 h-4" />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
