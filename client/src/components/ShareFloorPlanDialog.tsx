import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Mail, Loader2 } from "lucide-react";
import { FloorPlan } from "@/lib/floorPlanTypes";
import { trpc } from "@/lib/trpc";

interface ShareFloorPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: FloorPlan;
}

export default function ShareFloorPlanDialog({
  open,
  onOpenChange,
  plan,
}: ShareFloorPlanDialogProps) {
  const downloadPdfMutation = trpc.sharing.downloadFloorPlanPdf.useMutation();
  const emailMutation = trpc.sharing.sendFloorPlanEmail.useMutation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await downloadPdfMutation.mutateAsync({
        floorPlanId: plan.id,
      });
      
      // Decode base64 and create blob
      const binaryString = atob(result.pdfData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      await emailMutation.mutateAsync({
        floorPlanId: plan.id,
        recipientEmail: email,
      });
      setSuccess(true);
      setEmail("");
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Floor Plan</DialogTitle>
          <DialogDescription>
            Download or email a PDF of "{plan.name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="download" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download a high-quality PDF of your floor plan with all measurements and details.
            </p>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Send the floor plan PDF to an email address.
            </p>
            {error && <div className="text-sm text-destructive">{error}</div>}
            {success && (
              <div className="text-sm text-green-600">
                Email sent successfully!
              </div>
            )}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
