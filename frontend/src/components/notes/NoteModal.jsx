import React from "react";
import NoteEditor from "./NoteEditor.jsx";

const NoteModal = (props) => (
  <div className="modal-backdrop" role="presentation" onMouseDown={props.onClose}>
    <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <NoteEditor {...props} />
    </div>
  </div>
);

export default NoteModal;
