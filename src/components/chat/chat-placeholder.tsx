import { MessageSquareText } from "lucide-react";

export function ChatPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30">
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl">
            <MessageSquareText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold font-headline">Select a chat to start</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
                Choose a conversation from the list on the left to view messages or reassign agents.
            </p>
        </div>
    </div>
  );
}
