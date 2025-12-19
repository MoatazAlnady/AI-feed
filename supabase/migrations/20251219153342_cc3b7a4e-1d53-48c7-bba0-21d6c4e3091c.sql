-- Create trigger function to send notification when report status changes
CREATE OR REPLACE FUNCTION notify_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.reporter_id,
      'report_update',
      'Report Status Updated',
      'Your content report status has been updated to: ' || NEW.status,
      '/settings?tab=reports',
      jsonb_build_object('report_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'content_type', NEW.content_type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on reports table
DROP TRIGGER IF EXISTS on_report_status_change ON reports;
CREATE TRIGGER on_report_status_change
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_report_status_change();

-- Create trigger function to send notification when support ticket status changes
CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.user_id,
      'ticket_update',
      'Support Ticket Updated',
      'Your support ticket "' || NEW.subject || '" status has been updated to: ' || NEW.status,
      '/settings?tab=reports',
      jsonb_build_object('ticket_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'subject', NEW.subject)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on support_tickets table
DROP TRIGGER IF EXISTS on_ticket_status_change ON support_tickets;
CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_status_change();