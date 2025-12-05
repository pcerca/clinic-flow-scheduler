import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Patient, LocationType } from '../types';
import { MapPin, AlertCircle } from 'lucide-react';
import { getSessionStyle } from '../utils/styling';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface MapViewProps {
    patients: Patient[];
    selectedDate?: string;
}

// Component to handle map bounds
function MapBounds({ markers }: { markers: { lat: number; lng: number }[] }) {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);

    return null;
}

export function MapView({ patients, selectedDate }: MapViewProps) {
    // Filter to domicile patients only
    const domicilePatients = patients.filter(p => p.location === LocationType.HOME && p.address);

    // Further filter by selected date if provided
    const patientsToShow = selectedDate
        ? domicilePatients.filter(p =>
            p.sessions.some(s => s.date === selectedDate)
        ).sort((a, b) => {
            const aTime = a.sessions.find(s => s.date === selectedDate)?.time || '';
            const bTime = b.sessions.find(s => s.date === selectedDate)?.time || '';
            return aTime.localeCompare(bTime);
        })
        : domicilePatients;

    if (patientsToShow.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                    {selectedDate
                        ? 'No domicile patients scheduled for this day'
                        : 'No domicile patients with addresses'}
                </p>
            </div>
        );
    }

    // Filter patients with coordinates
    const patientsWithCoords = patientsToShow.filter(p => p.coordinates);

    // Calculate center point for map (fallback if no bounds)
    const getMapCenter = (): [number, number] => {
        if (patientsWithCoords.length === 0) {
            // Default to Lisbon, Portugal if no coordinates
            return [38.7223, -9.1393];
        }
        const avgLat = patientsWithCoords.reduce((sum, p) => sum + (p.coordinates?.lat || 0), 0) / patientsWithCoords.length;
        const avgLng = patientsWithCoords.reduce((sum, p) => sum + (p.coordinates?.lng || 0), 0) / patientsWithCoords.length;
        return [avgLat, avgLng];
    };

    return (
        <div className="space-y-4">
            {/* Patient List - Manual Route Planning */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedDate ? 'Daily Route' : 'All Domicile Patients'}
                </h3>
                <div className="space-y-2">
                    {patientsToShow.map((patient, index) => {
                        const session = selectedDate ? patient.sessions.find(s => s.date === selectedDate) : null;
                        const visitTime = session?.time;
                        const styles = session && selectedDate ? getSessionStyle(session, selectedDate) : null;

                        return (
                            <div
                                key={patient.id}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${styles ? styles.container : 'bg-slate-50 hover:bg-slate-100'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold ${styles ? styles.text : 'text-slate-800'}`}>{patient.name}</div>
                                    {visitTime && (
                                        <div className={`text-xs mt-0.5 ${styles ? styles.text : 'text-slate-500'}`}>
                                            {visitTime}
                                        </div>
                                    )}
                                    <div className="text-sm text-slate-600 mt-1 line-clamp-2">
                                        {patient.address}
                                    </div>
                                    {!patient.coordinates && (
                                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            No coordinates - add them to show on map
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* OpenStreetMap */}
            {patientsWithCoords.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-2 overflow-hidden">
                    <MapContainer
                        center={getMapCenter()}
                        zoom={13}
                        style={{ height: '400px', width: '100%', borderRadius: '0.75rem' }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapBounds markers={patientsWithCoords.map(p => p.coordinates!)} />
                        {patientsWithCoords.map((patient, index) => {
                            if (!patient.coordinates) return null;
                            const visitTime = selectedDate
                                ? patient.sessions.find(s => s.date === selectedDate)?.time
                                : null;

                            return (
                                <Marker
                                    key={patient.id}
                                    position={[patient.coordinates.lat, patient.coordinates.lng]}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <div className="font-bold text-sm mb-1">
                                                #{index + 1} - {patient.name}
                                            </div>
                                            {visitTime && (
                                                <div className="text-xs text-slate-600 mb-1">
                                                    🕐 {visitTime}
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500">
                                                {patient.address}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-blue-900 mb-2">Add Coordinates to See Map</h3>
                    <p className="text-sm text-blue-700">
                        To display patients on the map, add coordinates (latitude/longitude) when editing each patient.
                    </p>
                </div>
            )}
        </div>
    );
}
