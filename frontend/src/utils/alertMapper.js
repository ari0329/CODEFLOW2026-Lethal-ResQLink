export function mapBackendAlertToFrontend(alert) {
  if (!alert) return null;
  return {
    _id: alert._id,
    coordinates: alert.location ? { lat: alert.location.lat, lng: alert.location.lon } : null,
    emergencyType: alert.emergency_type || 'unknown',
    severity: (alert.severity_level || 'low').toLowerCase(),
    urgencyScore: alert.severity_score || 0,
    locationText: alert.location?.display_name || '',
    address: alert.location?.display_name || '',
    victimCount: alert.victim_count || '',
    cleanedText: alert.cleaned_text || alert.original_text || '',
    originalText: alert.original_text || '',
    verified: alert.confidence > 0.7 || alert.status !== 'PENDING'
  };
}
