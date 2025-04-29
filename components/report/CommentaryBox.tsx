import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CommentaryBoxProps {
  title: string;
  commentary: string;
  onUpdate?: (commentary: string) => void;
  isEditable?: boolean;
}

const CommentaryBox: React.FC<CommentaryBoxProps> = ({ 
  title, 
  commentary, 
  onUpdate,
  isEditable = false
}) => {
  const [editing, setEditing] = useState(false);
  const [editedCommentary, setEditedCommentary] = useState(commentary);
  
  const handleEdit = () => {
    setEditing(true);
  };
  
  const handleCancel = () => {
    setEditedCommentary(commentary);
    setEditing(false);
  };
  
  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedCommentary);
    }
    setEditing(false);
  };
  
  // Split the content by paragraphs for better formatting when viewing
  const paragraphs = commentary.split('\n').filter(p => p.trim().length > 0);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {isEditable && !editing && (
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <span className="material-icons text-sm mr-1">edit</span>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <>
            <Textarea
              value={editedCommentary}
              onChange={(e) => setEditedCommentary(e.target.value)}
              rows={8}
              placeholder="Add your commentary here..."
              className="mb-4"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Commentary
              </Button>
            </div>
          </>
        ) : (
          <div className="prose prose-sm max-w-none text-neutral-700">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <p className="text-neutral-500 italic">No commentary has been added yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentaryBox;
