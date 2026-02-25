import React from "react";

function TimeSlot({ slot, isBooked, isPast, onSelect, onCancel }) {
  const handleClick = () => {
    if (isBooked) onCancel(slot);
    else if (!isPast) onSelect(slot);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        padding: "10px 0",
        flex: "1 1 120px",  // flex-grow, flex-shrink, flex-basis
        minWidth: "120px",  // won't shrink below this
        margin: "5px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        cursor: isPast ? "not-allowed" : "pointer",
        backgroundColor: isBooked ? "#f88" : isPast ? "#ddd" : "#8f8",
        color: isPast ? "#888" : "#000",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {slot} {isBooked && "(Booked)"} {isPast && "(Past)"}
    </div>
  );
}

export default TimeSlot;