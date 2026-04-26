import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { Calendar, Eye, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function BlogPostDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="container py-24 max-w-3xl mx-auto">
        <div className="h-8 w-24 bg-secondary/10 animate-pulse rounded mb-8" />
        <div className="h-12 w-full bg-secondary/10 animate-pulse rounded mb-4" />
        <div className="h-6 w-1/2 bg-secondary/10 animate-pulse rounded mb-12" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-4 w-full bg-secondary/10 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Link href="/blog">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="container py-24 relative min-h-screen">
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-primary -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to archives
          </Button>
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground mb-4 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-primary">
              <Calendar className="w-3 h-3" />
              {format(new Date(post.publishedAt || post.createdAt), "MMMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              {post.viewCount} VIEWS
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-xl text-muted-foreground leading-relaxed italic">
              {post.description}
            </p>
          )}
        </header>

        <div className="prose prose-invert prose-primary max-w-none mb-16 prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:text-secondary-foreground prose-p:leading-relaxed prose-a:text-primary prose-ol:list-decimal prose-ol:ml-4 prose-li:marker:text-foreground prose-li:marker:font-mono prose-strong:text-primary prose-code:text-primary prose-code:bg-secondary/30 prose-code:px-1 prose-code:rounded prose-pre:bg-secondary/20 prose-pre:border prose-pre:border-border/40 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:text-muted-foreground">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <footer className="pt-12 border-t border-border/40">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/10 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Ready to accelerate?</h3>
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">30 years of elite engineering at your service</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-8 max-w-xl">
                Christopher Cotton helps engineering teams ship bulletproof infrastructure in 3 days. 
                No fluff. Just the architecture, the code, and the results.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/book?type=sprint">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20">
                    Book a Sprint
                  </Button>
                </Link>
                <Link href="/#newsletter">
                  <Button variant="outline" className="border-border hover:border-primary/40 text-muted-foreground hover:text-primary">
                    Join Newsletter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </article>
  );
}
