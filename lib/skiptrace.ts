export interface SkipTraceResult {
    phones: Array<{ number: string; type?: string }>;
    emails: string[];
    raw?: unknown;
  }
  
  export async function skipTrace(
    ownerName: string,
    address: string,
    city: string,
    state: string,
    zip?: string
  ): Promise<SkipTraceResult | null> {
    // Parse owner name — Realie returns "LASTNAME, FIRSTNAME" or "LASTNAME, FIRST; LASTNAME2"
    const primaryOwner = ownerName.split(";")[0].trim();
    let firstName = "";
    let lastName = "";
  
    if (primaryOwner.includes(",")) {
      const parts = primaryOwner.split(",").map((s) => s.trim());
      lastName = parts[0] || "";
      firstName = (parts[1] || "").split(" ")[0] || "";
    } else {
      const parts = primaryOwner.split(" ").filter(Boolean);
      firstName = parts[0] || "";
      lastName = parts[parts.length - 1] || "";
    }
  
    if (!firstName || !lastName) return null;
  
    const streetOnly = address.split(",")[0]?.trim() || address;
  
    try {
      const res = await fetch("/api/skiptrace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, address: streetOnly, city, state, zip }),
      });
  
      if (!res.ok) return null;
      const data = await res.json();
  
      const phones: Array<{ number: string; type?: string }> = [];
      const emails: string[] = [];
  
      // Tracerfy returns CSV-parsed records with phone1-phone8, email1-email5
      const records = data.results || (Array.isArray(data) ? data : [data]);
  
      for (const rec of records) {
        // Extract phones (phone1 through phone8, or phone_1 through phone_8)
        for (let i = 1; i <= 8; i++) {
          const num =
            rec[`phone${i}`] || rec[`phone_${i}`] || rec[`Phone${i}`] || rec[`phone ${i}`] || "";
          const type =
            rec[`phone${i}_type`] || rec[`phone_${i}_type`] || rec[`Phone${i}_Type`] ||
            rec[`phone ${i} type`] || "";
          const cleaned = String(num).replace(/\D/g, "");
          if (cleaned.length >= 7) {
            // Avoid duplicates
            if (!phones.find((p) => p.number.replace(/\D/g, "") === cleaned)) {
              phones.push({ number: cleaned, type: String(type) });
            }
          }
        }
  
        // Extract emails (email1 through email5, or email_1 through email_5)
        for (let i = 1; i <= 5; i++) {
          const addr =
            rec[`email${i}`] || rec[`email_${i}`] || rec[`Email${i}`] || rec[`email ${i}`] || "";
          if (String(addr).includes("@") && !emails.includes(String(addr))) {
            emails.push(String(addr));
          }
        }
  
        // Also check generic "email" and "phone" keys
        if (rec.email && String(rec.email).includes("@") && !emails.includes(String(rec.email))) {
          emails.push(String(rec.email));
        }
        const genericPhone = String(rec.phone || "").replace(/\D/g, "");
        if (genericPhone.length >= 7 && !phones.find((p) => p.number === genericPhone)) {
          phones.push({ number: genericPhone, type: "" });
        }
      }
  
      if (phones.length === 0 && emails.length === 0) return null;
  
      return { phones, emails, raw: data };
    } catch (err) {
      console.error("Skip trace error:", err);
      return null;
    }
  }