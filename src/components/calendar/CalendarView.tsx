import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarEventDialog } from "./CalendarEventDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOrganization } from "@/hooks/useOrganization";

type ViewMode = "day" | "week" | "month";

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string | null;
  location?: string | null;
  project_id?: string | null;
  visibility: "personal" | "organization";
  organization_id: string | null;
}

export function CalendarView() {
  const { context } = useOrganization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [context]);

  const loadEvents = async () => {
    let query = supabase
      .from("calendar_events")
      .select("*")
      .order("start_time", { ascending: true });

    // Filter by context
    if (context.mode === "personal") {
      query = query.eq("visibility", "personal");
    } else if (context.mode === "organization" && context.organizationId) {
      query = query.eq("visibility", "organization").eq("organization_id", context.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return;
    }
    setEvents((data || []).map(e => ({
      ...e,
      visibility: e.visibility as "personal" | "organization"
    })));
  };

  const navigatePrev = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      return isSameDay(eventStart, day);
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;
    return {
      top: `${startHour * 60}px`,
      height: `${Math.max(duration * 60, 20)}px`,
    };
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getHeaderText = () => {
    if (viewMode === "day") {
      return format(currentDate, "EEEE, MMMM d, yyyy");
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setDialogOpen(true);
  };

  const handleAddEvent = (date?: Date, time?: string) => {
    setSelectedEvent(null);
    setSelectedDate(date || currentDate);
    setSelectedTime(time);
    setDialogOpen(true);
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    const time = `${hour.toString().padStart(2, "0")}:00`;
    handleAddEvent(day, time);
  };

  const getDateRangeForView = () => {
    if (viewMode === "day") {
      return { start: currentDate, end: currentDate };
    } else if (viewMode === "week") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  };

  const handleSyncCalendar = async () => {
    setSyncing(true);
    try {
      const { start, end } = getDateRangeForView();
      const afterDate = format(start, "yyyy-MM-dd");
      const beforeDate = format(end, "yyyy-MM-dd");
      
      // Call the edge function to fetch Google Calendar events
      const { data, error } = await supabase.functions.invoke("sync-google-calendar", {
        body: {
          after: afterDate,
          before: beforeDate,
          viewMode,
          organizationId: context.mode === "organization" ? context.organizationId : null,
        },
      });

      // Handle "needsAuth" response - user needs to connect Google account
      if (data?.needsAuth) {
        toast.info("Connect your Google Calendar in Settings → Integrations to sync events");
        return;
      }

      if (error) throw error;
      
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(data?.message || `Calendar synced for ${viewMode} view`);
        await loadEvents();
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      // Check if it's a 401 auth error
      if (error?.message?.includes("401") || error?.status === 401) {
        toast.info("Connect your Google Calendar in Settings → Integrations to sync events");
      } else {
        toast.error("Failed to sync calendar");
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{getHeaderText()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSyncCalendar} 
            size="sm" 
            variant="outline" 
            className="gap-1"
            disabled={syncing}
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
          <Button onClick={() => handleAddEvent()} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="capitalize"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-auto">
        {viewMode === "day" && (
          <DayView
            date={currentDate}
            hours={hours}
            events={getEventsForDay(currentDate)}
            getEventPosition={getEventPosition}
            onEventClick={handleEventClick}
            onTimeSlotClick={(hour) => handleTimeSlotClick(currentDate, hour)}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            currentDate={currentDate}
            hours={hours}
            getEventsForDay={getEventsForDay}
            getEventPosition={getEventPosition}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            currentDate={currentDate}
            getEventsForDay={getEventsForDay}
            onEventClick={handleEventClick}
            onDayClick={(day) => {
              setCurrentDate(day);
              setViewMode("day");
            }}
          />
        )}
      </div>

      {/* Event Dialog */}
      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        onSave={loadEvents}
        defaultDate={selectedDate}
        defaultTime={selectedTime}
      />
    </div>
  );
}

interface DayViewProps {
  date: Date;
  hours: number[];
  events: CalendarEvent[];
  getEventPosition: (event: CalendarEvent) => { top: string; height: string };
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (hour: number) => void;
}

function DayView({ date, hours, events, getEventPosition, onEventClick, onTimeSlotClick }: DayViewProps) {
  return (
    <div className="flex">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-border">
        {hours.map((hour) => (
          <div key={hour} className="h-[60px] pr-2 text-right text-xs text-muted-foreground">
            {format(new Date().setHours(hour, 0), "h a")}
          </div>
        ))}
      </div>
      {/* Events column */}
      <div className="flex-1 relative">
        {hours.map((hour) => (
          <div 
            key={hour} 
            className="h-[60px] border-b border-border/50 cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => onTimeSlotClick?.(hour)}
          />
        ))}
        {/* Events overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {events.map((event) => {
            const position = getEventPosition(event);
            return (
              <div
                key={event.id}
                className="absolute left-1 right-1 bg-primary/20 border-l-2 border-primary rounded px-2 py-1 text-xs overflow-hidden pointer-events-auto cursor-pointer hover:bg-primary/30 transition-colors"
                style={position}
                onClick={() => onEventClick?.(event)}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-muted-foreground truncate">
                  {format(new Date(event.start_time), "h:mm a")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface WeekViewProps {
  currentDate: Date;
  hours: number[];
  getEventsForDay: (day: Date) => CalendarEvent[];
  getEventPosition: (event: CalendarEvent) => { top: string; height: string };
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (day: Date, hour: number) => void;
}

function WeekView({ currentDate, hours, getEventsForDay, getEventPosition, onEventClick, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate, { weekStartsOn: 0 }),
  });

  return (
    <div className="flex flex-col">
      {/* Day headers */}
      <div className="flex border-b border-border sticky top-0 bg-background z-10">
        <div className="w-16 flex-shrink-0" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 text-center py-2 border-l border-border",
              isSameDay(day, new Date()) && "bg-primary/10"
            )}
          >
            <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
            <div className={cn(
              "text-lg font-semibold",
              isSameDay(day, new Date()) && "text-primary"
            )}>
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] pr-2 text-right text-xs text-muted-foreground border-r border-border">
              {format(new Date().setHours(hour, 0), "h a")}
            </div>
          ))}
        </div>
        {/* Days columns */}
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 relative border-l border-border",
                isSameDay(day, new Date()) && "bg-primary/5"
              )}
            >
              {hours.map((hour) => (
                <div 
                  key={hour} 
                  className="h-[60px] border-b border-border/50 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => onTimeSlotClick?.(day, hour)}
                />
              ))}
              {/* Events overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.map((event) => {
                  const position = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 bg-primary/20 border-l-2 border-primary rounded px-1 py-0.5 text-xs overflow-hidden pointer-events-auto cursor-pointer hover:bg-primary/30 transition-colors"
                      style={position}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-medium truncate text-[10px]">{event.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MonthViewProps {
  currentDate: Date;
  getEventsForDay: (day: Date) => CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (day: Date) => void;
}

function MonthView({ currentDate, getEventsForDay, onEventClick, onDayClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div key={day} className="text-center py-2 text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-[repeat(auto-fill,minmax(100px,1fr))]">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-border">
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-1 border-r border-border cursor-pointer hover:bg-muted/50 transition-colors",
                    !isCurrentMonth && "bg-muted/30"
                  )}
                  onClick={() => onDayClick?.(day)}
                >
                  <div className={cn(
                    "text-sm w-7 h-7 flex items-center justify-center rounded-full mb-1",
                    isToday && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] bg-primary/20 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-primary/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarView;