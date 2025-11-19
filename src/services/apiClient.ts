export async function generateFirstStep(goalTitle: string, goalDescription: string) {
  const res = await fetch("/api/generateFirstStep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalTitle, goalDescription })
  });
  return await res.json();
}

export async function generateNextStep(goal: any) {
  const res = await fetch("/api/generateNextStep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal })
  });
  return await res.json();
}

export async function suggestTools(title: string, description: string) {
  const res = await fetch("/api/suggestTools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description })
  });
  return await res.json();
}

export async function suggestGoalTheme(title: string, description: string) {
  const res = await fetch("/api/suggestGoalTheme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description })
  });
  return await res.json();
}

export async function generateMapBackground(theme: string) {
  const res = await fetch("/api/generateMapBackground", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme })
  });

  if (!res.ok) {
    throw new Error("Map generation failed");
  }

  // Convert PNG response to a blob URL
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
