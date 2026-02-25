// src/components/CancelModal.jsx
import React from "react";

function CancelModal({ slot, date, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", top:0, left:0, right:0, bottom:0,
      backgroundColor:"rgba(0,0,0,0.5)", display:"flex",
      justifyContent:"center", alignItems:"center"
    }}>
      <div style={{ background:"white", padding:"20px", borderRadius:"8px" }}>
        <p>Cancel booking for {slot} on {date}?</p>
        <button onClick={onConfirm}>Yes, Cancel</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
}

export default CancelModal;