import React, { useMemo } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

interface Item {
  id: string | number;
  label: string;
  value: string | number;
}

interface RankingListProps {
  items: Item[];
  value: Item[];
  onChange: (items: Item[]) => void;
}

const SortableItem = ({ item, index }: { item: Item; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center p-3 mb-2 border rounded-md ${
        isDragging ? "bg-blue-50 border-primary shadow-md" : "bg-white border-gray-200 hover:border-gray-300"
      }`}
      {...attributes} 
      {...listeners}
    >
      <div className="mr-3 flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
        {index + 1}
      </div>
      <div className="flex-1 text-slate-800">{item.label}</div>
      <div className="ml-2 flex-shrink-0 text-slate-500">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-slate-400"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      </div>
    </div>
  );
};

const RankingList: React.FC<RankingListProps> = ({ items, value, onChange }) => {
  // Initialize value from items if not provided
  const rankedItems = useMemo(() => {
    if (value && value.length > 0) {
      // If we have existing ranked items, use them
      return value;
    } else {
      // Otherwise, initialize with all provided items
      return [...items];
    }
  }, [items, value]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = rankedItems.findIndex(item => item.id === active.id);
      const newIndex = rankedItems.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(rankedItems, oldIndex, newIndex);
      onChange(newItems);
    }
  }
  
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <p className="text-sm text-slate-600 mb-4">
        Drag and drop items to rank them in order of importance or priority.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={rankedItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {rankedItems.map((item, index) => (
            <SortableItem key={item.id} item={item} index={index} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default RankingList;
