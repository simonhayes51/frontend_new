const API_BASE = import.meta.env.VITE_API_URL || "";

export async function fetchNextEvent() {
  const r = await fetch(`${API_BASE}/api/events/next`);
  if (!r.ok) throw new Error(`Failed: ${r.status}`);
  return r.json();
}

export async function createEvent(eventData) {
  // Validate required fields match your database schema
  const requiredFields = ['name', 'kind', 'start_at'];
  for (const field of requiredFields) {
    if (!eventData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const r = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData)
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`Failed to create event: ${r.status} - ${errorText}`);
  }
  
  return r.json();
}

export async function fetchAllEvents() {
  const r = await fetch(`${API_BASE}/api/events`);
  if (!r.ok) throw new Error(`Failed: ${r.status}`);
  return r.json();
}

export async function updateEvent(id, eventData) {
  const r = await fetch(`${API_BASE}/api/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData)
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`Failed to update event: ${r.status} - ${errorText}`);
  }
  
  return r.json();
}

export async function deleteEvent(id) {
  const r = await fetch(`${API_BASE}/api/events/${id}`, {
    method: 'DELETE'
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`Failed to delete event: ${r.status} - ${errorText}`);
  }
  
  return r.ok;
}
