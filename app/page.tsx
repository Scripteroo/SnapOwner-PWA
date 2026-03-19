const savePropertyAction = useCallback(async () => {
  if (navigator.vibrate) navigator.vibrate(15);
  setSaving(true);
  try {
    // Create thumbnail for the list view
    let thumbnailUrl: string | null = null;
    if (camera.photoUrl) {
      const { createThumbnail } = await import("@/lib/image-utils");
      thumbnailUrl = await createThumbnail(camera.photoUrl);
    }

    // Save to localStorage
    saveToLocal({
      address: displayAddress,
      latitude: geo.latitude,
      longitude: geo.longitude,
      photoUrl: camera.photoUrl,
      thumbnailUrl,
    });
    setPropertyCount(getPropertyCount());

    // Also save to Supabase if configured
    if (isSupabaseConfigured) {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        await supabase.auth.signInAnonymously();
      }
      await supabase.from("properties").insert({
        address: displayAddress,
        latitude: geo.latitude || 24.5551,
        longitude: geo.longitude || -81.7800,
        photo_url: camera.photoUrl || null,
      });
    }

    setSaved(true);
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    showToast("Property saved!");
    setTimeout(() => setSaved(false), 2500);
  } catch (err) {
    console.error("Save failed:", err);
    setSaved(true);
    showToast("Property saved!");
    setTimeout(() => setSaved(false), 2500);
  } finally {
    setSaving(false);
  }
}, [displayAddress, geo.latitude, geo.longitude, camera.photoUrl]);