import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Home,
  Layers,
  LayoutGrid,
  List,
  Calendar,
  AlertTriangle,
  Loader2,
  Trash2,
  PlayCircle,
  Eye,
  PauseCircle,
  Ban,
  FileCheck,
} from "lucide-react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useRooms, useBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

// Import common components
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/common";
import type { Column, RowAction } from "@/components/common";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  room: string;
  batch: string | null;
  assignedTo: string;
  status: string;
  priority: string;
  dueDate: string;
  category: string;
}

const Tasks = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roomId: "",
    batchId: "",
    priority: "medium",
    dueDate: "",
  });

  // Fetch data from API
  const { data: apiTasks, isLoading } = useTasks();
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Handle form submission
  const handleCreateTask = async () => {
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
        batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
      });

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        roomId: "",
        batchId: "",
        priority: "medium",
        dueDate: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task status update
  const handleCompleteTask = async (taskId: string | number) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { status: "DONE" },
      });
      toast({
        title: "Success",
        description: "Task marked as complete",
      });
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId: string | number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await deleteTask.mutateAsync(taskId);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Handle drag start
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnStatus);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  // Handle drop - update task status
  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);

    if (!draggedTask) return;

    // Don't update if status is the same
    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      // Map column status to database status
      // Note: 'overdue' is a display status, not a database status
      // If dragging from overdue, we need to use the actual status
      const statusMap: Record<string, string> = {
        TODO: "TODO",
        IN_PROCESS: "IN_PROCESS",
        IN_REVIEW: "IN_REVIEW",
        HOLD: "HOLD",
        BLOCKED: "BLOCKED",
        DONE: "DONE",
        overdue: "TODO", // Overdue tasks should go back to TODO when moved
      };

      const dbStatus = statusMap[targetStatus] || targetStatus;

      await updateTask.mutateAsync({
        id: draggedTask.id,
        updates: { status: dbStatus },
      });

      toast({
        title: "Success",
        description: `Task moved to ${targetStatus.replace("_", " ")}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setDraggedTask(null);
    }
  };

  // Transform API data
  const tasks: Task[] = Array.isArray(apiTasks) 
    ? apiTasks.map((t: any) => ({
        id: String(t.id),
        title: t.title,
        description: t.description || "",
        room: t.room_name || "General",
        batch: t.batch_name || null,
        assignedTo: t.assigned_name || "Unassigned",
        status: t.display_status || t.status || "pending",
        priority: t.display_priority || t.priority || "medium",
        dueDate: t.due_date ? (typeof t.due_date === 'string' ? t.due_date : new Date(t.due_date).toISOString()) : new Date().toISOString(),
        category: t.task_type || "general",
      }))
    : [];

  // Use API data only
  const finalTasks = tasks;

  const getStatusBadgeType = (
    status: string
  ): "success" | "info" | "warning" | "danger" | "pending" => {
    const map: Record<string, "success" | "info" | "warning" | "danger" | "pending"> = {
      DONE: "success",
      IN_PROCESS: "info",
      IN_REVIEW: "info",
      TODO: "pending",
      HOLD: "warning",
      BLOCKED: "danger",
      overdue: "danger",
    };
    return map[status] || "pending";
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      TODO: Clock,
      IN_PROCESS: PlayCircle,
      IN_REVIEW: Eye,
      HOLD: PauseCircle,
      BLOCKED: Ban,
      DONE: CheckCircle2,
      overdue: AlertTriangle,
    };
    return iconMap[status] || Clock;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      TODO: "border-t-warning",
      IN_PROCESS: "border-t-info",
      IN_REVIEW: "border-t-primary",
      HOLD: "border-t-warning",
      BLOCKED: "border-t-destructive",
      DONE: "border-t-success",
      overdue: "border-t-destructive",
    };
    return colorMap[status] || "border-t-muted";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-destructive text-destructive-foreground",
      high: "bg-warning-light text-warning border-warning/20",
      medium: "bg-info-light text-info border-info/20",
      low: "bg-muted text-muted-foreground",
    };
    return colors[priority] || "bg-muted text-muted-foreground";
  };

  // Filter tasks by status
  const todoTasks = finalTasks.filter(
    (t) => t.status === "TODO" || t.status === "overdue"
  );
  const inProcessTasks = finalTasks.filter((t) => t.status === "IN_PROCESS");
  const inReviewTasks = finalTasks.filter((t) => t.status === "IN_REVIEW");
  const holdTasks = finalTasks.filter((t) => t.status === "HOLD");
  const blockedTasks = finalTasks.filter((t) => t.status === "BLOCKED");
  const doneTasks = finalTasks.filter((t) => t.status === "DONE");

  // Filter upcoming tasks (due date in future and not done)
  const upcomingTasks = finalTasks.filter((t) => {
    if (t.status === "DONE" || t.status === "BLOCKED") return false;
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate > today;
  });

  // Stats
  const stats = {
    total: finalTasks.length,
    todo: todoTasks.length,
    inProcess: inProcessTasks.length,
    inReview: inReviewTasks.length,
    hold: holdTasks.length,
    blocked: blockedTasks.length,
    done: doneTasks.length,
    overdue: finalTasks.filter((t) => t.status === "overdue").length,
  };

  // Table columns
  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Task",
      sortable: true,
      cell: (row) => (
        <div className="max-w-md">
          <p className="font-medium text-foreground truncate">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">{row.description}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          status={getStatusBadgeType(row.status)}
          label={row.status === "overdue" ? "Overdue" : row.status.replace(/_/g, " ")}
          size="sm"
        />
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className={cn("capitalize", getPriorityColor(row.priority))}>
          {row.priority}
        </Badge>
      ),
    },
    {
      key: "room",
      header: "Room",
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.room}</span>,
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      sortable: true,
      cell: (row) => <span>{row.assignedTo}</span>,
    },
    {
      key: "dueDate",
      header: "Due",
      sortable: true,
      cell: (row) => (
        <span className="text-muted-foreground text-sm">
          {new Date(row.dueDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<Task>[] = [
    {
      label: "Mark Complete",
      icon: <CheckCircle2 className="w-4 h-4" />,
      onClick: (row) => handleCompleteTask(row.id),
      disabled: (row) => row.status === "DONE",
    },
    {
      label: "Edit",
      icon: <ClipboardList className="w-4 h-4" />,
      onClick: (row) => console.log("Edit:", row.id),
    },
  ];

  const TaskCard = ({ task }: { task: Task }) => {
    const handleCheckboxChange = async (checked: boolean) => {
      const newStatus = checked ? "DONE" : "TODO";
      try {
        await updateTask.mutateAsync({
          id: task.id,
          updates: { status: newStatus },
        });
        toast({
          title: "Success",
          description: `Task marked as ${newStatus}`,
        });
      } catch (error: any) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update task",
          variant: "destructive",
        });
      }
    };

    return (
      <div
        draggable
        onDragStart={(e) => {
          // Don't drag if clicking on checkbox
          if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
            e.preventDefault();
            return;
          }
          handleDragStart(task);
        }}
        className={cn(
          "p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200 group cursor-move",
          task.status === "overdue" && "border-destructive/30 bg-destructive/5",
          draggedTask?.id === task.id && "opacity-50"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          >
            <Checkbox
              className="mt-1"
              checked={task.status === "DONE"}
              onCheckedChange={handleCheckboxChange}
            />
          </div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-medium text-sm group-hover:text-primary transition-colors",
                task.status === "DONE" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("flex-shrink-0 text-xs", getPriorityColor(task.priority))}
              >
                {task.priority}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              <Home className="w-3 h-3" /> {task.room}
            </span>
            {task.batch && (
              <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                <Layers className="w-3 h-3" /> {task.batch}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              <User className="w-3 h-3" /> {task.assignedTo}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full",
                task.status === "overdue"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <Clock className="w-3 h-3" />
              {new Date(task.dueDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Tasks"
        description="Daily cultivation tasks and SOPs"
        breadcrumbs={[{ label: "Operations", href: "/tasks" }, { label: "Tasks" }]}
        badge={
          stats.overdue > 0 ? (
            <Badge variant="outline" className="bg-destructive-light text-destructive border-destructive/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {stats.overdue} overdue
            </Badge>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === "board" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode("table")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task to the queue</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Title *</Label>
                    <Input 
                      id="task-title" 
                      placeholder="Task title..." 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-desc">Description</Label>
                    <Textarea 
                      id="task-desc" 
                      placeholder="Task details..." 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Room</Label>
                      <Select 
                        value={formData.roomId} 
                        onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {(apiRooms || []).map((room: any) => (
                            <SelectItem key={room.id} value={String(room.id)}>
                              {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Batch (Optional)</Label>
                      <Select 
                        value={formData.batchId} 
                        onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {(apiBatches || []).map((batch: any) => (
                            <SelectItem key={batch.id} value={String(batch.id)}>
                              {batch.batchName || `Batch ${batch.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input 
                        id="due-date" 
                        type="datetime-local" 
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleCreateTask} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={<ClipboardList className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
        />
        <StatCard
          title="TODO"
          value={stats.todo}
          icon={<Clock className="w-6 h-6" />}
          iconColor="bg-warning-light text-warning"
          change={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
          trend={stats.overdue > 0 ? "down" : undefined}
        />
        <StatCard
          title="In Process"
          value={stats.inProcess}
          icon={<PlayCircle className="w-6 h-6" />}
          iconColor="bg-info-light text-info"
        />
        <StatCard
          title="In Review"
          value={stats.inReview}
          icon={<Eye className="w-6 h-6" />}
          iconColor="bg-primary-light text-primary"
        />
        <StatCard
          title="Hold"
          value={stats.hold}
          icon={<PauseCircle className="w-6 h-6" />}
          iconColor="bg-warning-light text-warning"
        />
        <StatCard
          title="Blocked"
          value={stats.blocked}
          icon={<Ban className="w-6 h-6" />}
          iconColor="bg-destructive-light text-destructive"
        />
        <StatCard
          title="Done"
          value={stats.done}
          icon={<CheckCircle2 className="w-6 h-6" />}
          iconColor="bg-success-light text-success"
          change="Today"
          trend="up"
        />
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <DataTable
          data={finalTasks}
          columns={columns}
          rowActions={rowActions}
          searchable
          searchPlaceholder="Search tasks..."
          searchKeys={["title", "description", "room", "assignedTo"]}
          pagination
          pageSize={10}
          loading={isLoading}
          getRowId={(row) => row.id}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title="No tasks found"
              description="Create your first task to get started"
              action={{
                label: "Create Task",
                onClick: () => setIsDialogOpen(true),
                icon: Plus,
              }}
            />
          }
        />
      ) : (
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="today" className="gap-2">
              <Calendar className="w-4 h-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {/* TODO */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("TODO"),
                  draggedOverColumn === "TODO" && "ring-2 ring-warning ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "TODO")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "TODO")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("TODO");
                      return <Icon className="w-4 h-4 text-warning" />;
                    })()}
                    TODO
                    <Badge variant="secondary" className="ml-auto">
                      {todoTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {todoTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    todoTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>

              {/* IN PROCESS */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("IN_PROCESS"),
                  draggedOverColumn === "IN_PROCESS" && "ring-2 ring-info ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "IN_PROCESS")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "IN_PROCESS")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("IN_PROCESS");
                      return <Icon className="w-4 h-4 text-info" />;
                    })()}
                    IN PROCESS
                    <Badge variant="secondary" className="ml-auto">
                      {inProcessTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {inProcessTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    inProcessTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>

              {/* IN REVIEW */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("IN_REVIEW"),
                  draggedOverColumn === "IN_REVIEW" && "ring-2 ring-primary ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "IN_REVIEW")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "IN_REVIEW")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("IN_REVIEW");
                      return <Icon className="w-4 h-4 text-primary" />;
                    })()}
                    IN REVIEW
                    <Badge variant="secondary" className="ml-auto">
                      {inReviewTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {inReviewTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    inReviewTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>

              {/* HOLD */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("HOLD"),
                  draggedOverColumn === "HOLD" && "ring-2 ring-warning ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "HOLD")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "HOLD")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("HOLD");
                      return <Icon className="w-4 h-4 text-warning" />;
                    })()}
                    HOLD
                    <Badge variant="secondary" className="ml-auto">
                      {holdTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {holdTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    holdTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>

              {/* BLOCKED */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("BLOCKED"),
                  draggedOverColumn === "BLOCKED" && "ring-2 ring-destructive ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "BLOCKED")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "BLOCKED")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("BLOCKED");
                      return <Icon className="w-4 h-4 text-destructive" />;
                    })()}
                    BLOCKED
                    <Badge variant="secondary" className="ml-auto">
                      {blockedTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {blockedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    blockedTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>

              {/* DONE */}
              <Card 
                className={cn(
                  "border-t-4 transition-all min-w-[280px]",
                  getStatusColor("DONE"),
                  draggedOverColumn === "DONE" && "ring-2 ring-success ring-offset-2"
                )}
                onDragOver={(e) => handleDragOver(e, "DONE")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "DONE")}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => {
                      const Icon = getStatusIcon("DONE");
                      return <Icon className="w-4 h-4 text-success" />;
                    })()}
                    DONE
                    <Badge variant="secondary" className="ml-auto">
                      {doneTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                  {doneTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  ) : (
                    doneTasks.map((task) => <TaskCard key={task.id} task={task} />)
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
                <Badge variant="secondary">{upcomingTasks.length} tasks</Badge>
              </div>
              {upcomingTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Upcoming Tasks</h3>
                      <p className="text-muted-foreground">
                        All your tasks are up to date
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Completed Tasks</h3>
                <Badge variant="secondary">{doneTasks.length} tasks</Badge>
              </div>
              {doneTasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-success mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Completed Tasks</h3>
                      <p className="text-muted-foreground">
                        Complete tasks to see them here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doneTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Tasks;
