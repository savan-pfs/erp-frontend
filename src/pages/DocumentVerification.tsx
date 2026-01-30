import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  Download,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Search
} from 'lucide-react';
import { documentsApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common';
import { Input } from '@/components/ui/input';

interface Document {
  id: number;
  organization_id: number;
  organization_name?: string;
  document_type: string;
  name: string;
  description?: string;
  file_name: string;
  file_size?: number;
  status: string;
  uploaded_by: number;
  uploaded_by_email?: string;
  created_at: string;
  expires_at?: string;
  rejection_reason?: string;
}

export default function DocumentVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (activeTab === 'pending') {
        params.status = 'PENDING_APPROVAL';
      } else if (activeTab === 'approved') {
        params.status = 'APPROVED';
      } else if (activeTab === 'rejected') {
        params.status = 'REJECTED';
      }
      // if 'all', we don't send status param

      const docs = await documentsApi.getAll(params);
      setDocuments(docs);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load documents',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;

    setProcessing(true);
    try {
      await documentsApi.approve(selectedDoc.id);
      toast({
        title: 'Document Approved',
        description: `${selectedDoc.name} has been approved successfully.`,
      });
      setShowApproveDialog(false);
      setSelectedDoc(null);
      loadDocuments();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejecting this document.',
      });
      return;
    }

    setProcessing(true);
    try {
      await documentsApi.reject(selectedDoc.id, rejectionReason);
      toast({
        title: 'Document Rejected',
        description: `${selectedDoc.name} has been rejected.`,
      });
      setShowRejectDialog(false);
      setSelectedDoc(null);
      setRejectionReason('');
      loadDocuments();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (docId: number, fileName: string) => {
    try {
      toast({
        title: "Downloading...",
        description: "Your download will start shortly.",
      });

      const blob = await documentsApi.download(docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Rejected</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Document Verification"
        description="Review compliance documents, licenses, and certifications"
        breadcrumbs={[{ label: 'Verification' }]}
        actions={
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="pending">
            Pending
            {/* Note: We'd typically separate badge counts, but effectively 0 if not fetched. 
                Ideally we fetch counts separately. For now, rely on active tab data size if convenient, 
                but since we reload on tab change, we can't show counts for inactive tabs accurately without more complex state.
                Simplifying to just labels for now.
             */}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium">No documents found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : `No ${activeTab} documents to display`}
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Details</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium flex items-center gap-2">
                                {doc.name}
                                {doc.file_size && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    ({formatFileSize(doc.file_size)})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">{doc.document_type}</Badge>
                                {doc.description && <span className="truncate max-w-[200px]">{doc.description}</span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{doc.organization_name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {doc.uploaded_by_email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(doc.id, doc.file_name)}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            {doc.status === 'PENDING_APPROVAL' && (
                              <div className="flex items-center gap-1 pl-2 border-l ml-2">
                                <Button
                                  size="sm"
                                  className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Approve Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to approve <span className="font-medium text-foreground">"{selectedDoc?.name}"</span>
              This will mark the document as verified and notify the organization.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg text-sm border">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Organization:</span>
              <span className="font-medium">{selectedDoc?.organization_name}</span>
              <span className="text-muted-foreground">Document Type:</span>
              <span className="font-medium">{selectedDoc?.document_type}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setSelectedDoc(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Reject Document
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting <span className="font-medium text-foreground">"{selectedDoc?.name}"</span>.
              This will be sent to the organization admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason <span className="text-destructive">*</span></Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Image is blurry, License expired, Wrong document type..."
                rows={4}
                className="resize-none"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedDoc(null);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
