import React from 'react';

export default function ActionDrawer({ open, title, subtitle, onClose, children }) {
  return (
    <>
      <div className={`drawerBackdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`actionDrawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawerHeader">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Close drawer">×</button>
        </div>
        <div className="drawerBody">{children}</div>
      </aside>
    </>
  );
}
