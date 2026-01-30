import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Layers,
  Scissors,
  CheckCircle2,
  Plus,
  Loader2,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent, useRooms, useBatches } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<"month" | "week" | "day">("month");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDateEventsDialogOpen, setIsDateEventsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    eventType: "task",
    eventDate: "",
    startTime: "",
    roomId: "",
    batchId: "",
    description: "",
  });

  // Fetch calendar events from API
  const { data: apiEvents, isLoading } = useCalendarEvents();
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  // Handle create event
  const handleCreateEvent = async () => {
    if (!formData.title || !formData.eventDate) {
      toast({
        title: "Error",
        description: "Title and date are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine eventDate and startTime into startDate
      let startDate = formData.eventDate;
      if (formData.startTime) {
        // Combine date and time into ISO string
        startDate = `${formData.eventDate}T${formData.startTime}:00`;
      } else {
        // If no time, use date at midnight
        startDate = `${formData.eventDate}T00:00:00`;
      }

      await createEvent.mutateAsync({
        title: formData.title,
        eventType: formData.eventType,
        startDate: startDate,
        roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
        batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        description: formData.description || undefined,
        allDay: !formData.startTime, // All day if no time specified
      });

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      setIsDialogOpen(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        eventType: "task",
        eventDate: "",
        startTime: "",
        roomId: "",
        batchId: "",
        description: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transform API events to component format
  const events = apiEvents?.map((event: any) => ({
    id: event.id.toString(),
    date: event.start_date || event.event_date,
    type: event.event_type || "task",
    title: event.title,
    description: event.description || "",
    room: event.room?.name || event.location || "N/A",
    roomId: event.room_id,
    batchId: event.batch_id,
    time: event.start_date 
      ? format(new Date(event.start_date), "HH:mm")
      : event.start_time 
      ? format(new Date(`2000-01-01T${event.start_time}`), "HH:mm")
      : "All day",
    fullEvent: event, // Keep full event data for editing
  })) || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  // Handle date click - show events popup
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDateEventsDialogOpen(true);
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Handle edit event
  const handleEditEvent = (event: any) => {
    const fullEvent = event.fullEvent || event;
    const eventDate = new Date(fullEvent.start_date || fullEvent.event_date);
    setEditingEvent(fullEvent);
    setFormData({
      title: fullEvent.title || "",
      eventType: fullEvent.event_type || "task",
      eventDate: format(eventDate, "yyyy-MM-dd"),
      startTime: eventDate.getHours() !== 0 || eventDate.getMinutes() !== 0 
        ? format(eventDate, "HH:mm")
        : "",
      roomId: fullEvent.room_id ? String(fullEvent.room_id) : "",
      batchId: fullEvent.batch_id ? String(fullEvent.batch_id) : "",
      description: fullEvent.description || "",
    });
    setIsDateEventsDialogOpen(false);
    setIsDialogOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId: string | number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      await deleteEvent.mutateAsync(eventId);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      if (selectedDateEvents.length === 1) {
        setIsDateEventsDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  // Handle update event
  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title || !formData.eventDate) {
      toast({
        title: "Error",
        description: "Title and date are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine eventDate and startTime into startDate
      let startDate = formData.eventDate;
      if (formData.startTime) {
        startDate = `${formData.eventDate}T${formData.startTime}:00`;
      } else {
        startDate = `${formData.eventDate}T00:00:00`;
      }

      await updateEvent.mutateAsync({
        id: editingEvent.id,
        updates: {
          title: formData.title,
          eventType: formData.eventType,
          startDate: startDate,
          description: formData.description || undefined,
          roomId: formData.roomId ? parseInt(formData.roomId) : undefined,
          batchId: formData.batchId ? parseInt(formData.batchId) : undefined,
        },
      });

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      setIsDialogOpen(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        eventType: "task",
        eventDate: "",
        startTime: "",
        roomId: "",
        batchId: "",
        description: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "harvest":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "task":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const todayEvents = events.filter((event) =>
    isSameDay(new Date(event.date), new Date())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading events..." : "Schedule tasks, harvests, and events"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={viewType}
            onValueChange={(v: "month" | "week" | "day") => setViewType(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Update event details" : "Schedule tasks, harvests, and events"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-title">Title *</Label>
                  <Input 
                    id="event-title" 
                    placeholder="Event title..." 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select 
                      value={formData.eventType} 
                      onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="harvest">Harvest</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-date">Date *</Label>
                    <Input 
                      id="event-date" 
                      type="date" 
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-time">Time</Label>
                    <Input 
                      id="event-time" 
                      type="time" 
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
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
                </div>
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
                  <Label htmlFor="event-desc">Description</Label>
                  <Textarea 
                    id="event-desc" 
                    placeholder="Event details..." 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  {editingEvent && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingEvent(null);
                        setFormData({
                          title: "",
                          eventType: "task",
                          eventDate: "",
                          startTime: "",
                          roomId: "",
                          batchId: "",
                          description: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    className={editingEvent ? "flex-1" : "w-full"} 
                    onClick={editingEvent ? handleUpdateEvent : handleCreateEvent} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingEvent ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editingEvent ? "Update Event" : "Create Event"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Date Events Popup */}
          <Dialog open={isDateEventsDialogOpen} onOpenChange={setIsDateEventsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                </DialogTitle>
                <DialogDescription>
                  Schedule tasks, harvests, and events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getEventColor(event.type)}>
                                {event.type}
                              </Badge>
                              <span className="font-medium">{event.title}</span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {event.time}
                              </span>
                              {event.room && event.room !== "N/A" && (
                                <span className="flex items-center gap-1">
                                  <Home className="w-4 h-4" />
                                  {event.room}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEvent(event)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No events scheduled for this date</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (selectedDate) {
                        setFormData({
                          ...formData,
                          eventDate: format(selectedDate, "yyyy-MM-dd"),
                        });
                      }
                      setIsDateEventsDialogOpen(false);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event to This Date
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.type === "task").length}
                </p>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.type === "harvest").length}
                </p>
                <p className="text-sm text-muted-foreground">Harvests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayEvents.length}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      {viewType === "month" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground p-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days in month */}
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square border rounded-lg p-1 cursor-pointer hover:bg-muted/50 transition-colors ${
                      isToday(day)
                        ? "bg-primary/10 border-primary"
                        : "border-border"
                    } ${!isSameMonth(day, currentDate) ? "opacity-30" : ""}`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday(day) ? "text-primary" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className={`text-xs p-0.5 rounded border ${getEventColor(
                            event.type
                          )} truncate cursor-pointer hover:opacity-80 transition-opacity`}
                          title={event.title}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getEventColor(event.type)}>
                          {event.type}
                        </Badge>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          {event.room}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events scheduled for today
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events
              .filter((event) => new Date(event.date) > new Date())
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getEventColor(event.type)}>
                          {event.type}
                        </Badge>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(event.date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          {event.room}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;
