import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Item {
  id: string | number;
  label: string;
  description?: string;
  value?: any;
}

interface RankingListProps {
  items: Item[];
  value: (string | number)[];
  onChange: (newOrder: (string | number)[]) => void;
}

const RankingList: React.FC<RankingListProps> = ({ items, value, onChange }) => {
  // Map the provided value (ordered IDs) to the full items
  const [orderedItems, setOrderedItems] = useState<Item[]>([]);
  
  // Initialize ordered items based on value
  useEffect(() => {
    if (value.length > 0) {
      // Order the items according to the value array
      const ordered = value
        .map(id => items.find(item => item.id === id))
        .filter(Boolean) as Item[];
      
      // Add any remaining items not in value
      const remainingItems = items.filter(item => !value.includes(item.id));
      setOrderedItems([...ordered, ...remainingItems]);
    } else {
      // Initialize with the original items order
      setOrderedItems([...items]);
    }
  }, [items, value]);
  
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    // If dropped outside the list or in the same position
    if (!destination || destination.index === source.index) {
      return;
    }
    
    // Reorder the items
    const reordered = [...orderedItems];
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    
    // Update state
    setOrderedItems(reordered);
    
    // Call onChange with the new order of IDs
    onChange(reordered.map(item => item.id));
  };
  
  return (
    <div className="space-y-2 py-3">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="ranking-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {orderedItems.map((item, index) => (
                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-3 bg-white border border-neutral-300 rounded-md flex items-center cursor-move shadow-sm"
                    >
                      <div className="bg-neutral-100 w-6 h-6 flex items-center justify-center rounded mr-3">
                        <span className="text-neutral-400 font-medium text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-neutral-500">{item.description}</div>
                        )}
                      </div>
                      <span className="material-icons ml-auto text-neutral-400">drag_indicator</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default RankingList;
