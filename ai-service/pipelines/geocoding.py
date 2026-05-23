"""
Geocoding Pipeline — converts location strings to lat/lon coordinates
Supports: Nominatim (OpenStreetMap, free) and Google Maps Geocoding API
"""
import httpx
import logging
from config import GEOCODING_API_KEY, GEOCODING_PROVIDER

logger = logging.getLogger("geocoding")


class GeocodingPipeline:
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    async def resolve(self, entities: dict) -> dict | None:
        """
        Returns {"lat": float, "lon": float, "display_name": str} or None
        Priority: explicit coordinates > address > landmark
        """
        # 1. If we already have coordinates, use them directly
        if entities.get("coordinates"):
            coords = entities["coordinates"]
            return {
                "lat": coords["lat"],
                "lon": coords["lon"],
                "display_name": f"{coords['lat']}, {coords['lon']}",
                "source": "extracted_coordinates",
            }

        # 2. Geocode from address or landmark string
        location_str = entities.get("address") or entities.get("landmark") or entities.get("raw_location_string")
        if not location_str:
            return None

        if GEOCODING_PROVIDER == "google" and GEOCODING_API_KEY:
            return await self._google_geocode(location_str)
        else:
            return await self._nominatim_geocode(location_str)

    async def _nominatim_geocode(self, query: str) -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    self.NOMINATIM_URL,
                    params={
                        "q": query,
                        "format": "json",
                        "limit": 1,
                    },
                    headers={"User-Agent": "ResQLink/1.0 (emergency-platform)"},
                )
                data = resp.json()
                if data:
                    return {
                        "lat": float(data[0]["lat"]),
                        "lon": float(data[0]["lon"]),
                        "display_name": data[0].get("display_name", query),
                        "source": "nominatim",
                    }
        except Exception as e:
            logger.error(f"Nominatim geocoding failed: {e}")
        return None

    async def _google_geocode(self, query: str) -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={"address": query, "key": GEOCODING_API_KEY},
                )
                data = resp.json()
                if data.get("results"):
                    loc = data["results"][0]["geometry"]["location"]
                    return {
                        "lat": loc["lat"],
                        "lon": loc["lng"],
                        "display_name": data["results"][0].get("formatted_address", query),
                        "source": "google",
                    }
        except Exception as e:
            logger.error(f"Google geocoding failed: {e}")
        return None