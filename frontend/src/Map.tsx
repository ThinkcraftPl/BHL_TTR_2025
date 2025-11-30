import { Circle, LayerGroup, LayersControl, MapContainer, Marker, Popup } from 'react-leaflet'
import { TileLayer } from 'react-leaflet'
import { useMap } from 'react-leaflet'
import { useGetBinsQuery } from './api';
import { useEffect, useState } from 'react';
import { Button, Sheet, ToggleButtonGroup } from '@mui/joy';

function mapBlueGreenRed(value: number, min: number, mid: number, max: number) {
    if (value <= mid) {
        const ratio = (value - min) / (mid - min);
        const r = Math.round(0 + ratio * (0 - 0));
        const g = Math.round(0 + ratio * (255 - 0));
        const b = Math.round(255 + ratio * (0 - 255));
        return `rgb(${r},${g},${b})`;
    } else {
        const ratio = (value - mid) / (max - mid);
        const r = Math.round(0 + ratio * (255 - 0));
        const g = Math.round(255 + ratio * (0 - 255));
        const b = Math.round(0 + ratio * (0 - 0));
        return `rgb(${r},${g},${b})`;
    }
}

const Map = () => {
    const { data: binsData, refetch } = useGetBinsQuery();
    const [displayType, setDisplayType] = useState<'fill' | 'temp' | 'humidity' | 'pollution' | 'type'>('fill');
    const [layers, setLayers] = useState<{
        name: string;
        markers: any[];
    }[]>([]);
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 5000); // Refetch every 5 seconds
        return () => clearInterval(interval);
    }, [refetch]);
    useEffect(() => {
        if (binsData) {
            const newLayers = binsData.map(bin => ({ name: bin.type, markers: [bin] })).reduce((acc: { name: string; markers: any[] }[], type: { name: string; markers: any[] }) => {
                const found = acc.find(l => l.name == type.name);
                if (!found) {
                    acc.push(type);
                }
                else {
                    found.markers.push(...type.markers);
                }
                return acc;
            }, []);
            setLayers(newLayers);
        }
    }, [binsData]);
    return (
        <Sheet sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 1, paddingTop: 1 }}>
            <ToggleButtonGroup value={displayType} onChange={(_, nv) => {
                if (nv) setDisplayType(nv);
            }}>
                <Button value="fill">Poziom</Button>
                <Button value="temp">Temperatura</Button>
                <Button value="humidity">Wilgotność</Button>
                <Button value="pollution">Zanieczyszczenie</Button>
                <Button value="type">Rodzaj odpadów</Button>
            </ToggleButtonGroup>
            <MapContainer center={[52.229272202737675, 21.01352829084932]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LayersControl position='topright'>
                    {
                        layers.map((layer) => (
                            <LayersControl.Overlay key={layer.name} name={layer.name} checked>
                                <LayerGroup>
                                    {
                                        layer.markers.map((marker, index) => (
                                            <Circle key={index} center={marker.location.split(',')}
                                                pathOptions={{
                                                    color: displayType == "fill" ? (marker.alarm ? 'orange' : marker.fillLevel > 80 ? 'red' : 'green') :
                                                        displayType == "humidity" ? (mapBlueGreenRed(marker.humidity ?? 0, 40, 40, 70)) :
                                                            displayType == "temp" ? (mapBlueGreenRed(marker.temperature ?? 0, 0, 20, 40)) :
                                                                displayType == "pollution" ? (mapBlueGreenRed(marker.pollution ?? 0, 0, 0, 100)) :
                                                                    displayType == "type" ? (
                                                                        marker.type == 'general' ? 'gray' :
                                                                            marker.type == 'plastic' ? 'yellow' :
                                                                                marker.type == 'glass' ? 'green' :
                                                                                    marker.type == 'paper' ? 'blue' :
                                                                                        marker.type == 'organic' ? 'brown' :
                                                                                            'gray'
                                                                    ) :
                                                                        'gray',
                                                }}
                                            >
                                                <Popup>
                                                    Poziom: {marker.fillLevel}% <br />
                                                    Temperatura: {marker.temperature}°C <br />
                                                    Rodzaj odpadów: {marker.type == "general" ? "Ogólne" : marker.type == "plastic" ? "Plastik" : marker.type == "glass" ? "Szkło" : marker.type == "paper" ? "Papier" : marker.type == "organic" ? "Bio" : "Nieznany"} <br />
                                                    Wilgotność: {marker.humidity}% <br />
                                                    Zanieczyszczenie: {marker.pollution}% <br />
                                                    {marker.alarm ? 'Alarm Aktywny' : 'Brak alarmu'} <br />
                                                    Ostatnie opróżnienie: {marker.lastEmptied ? new Date(marker.lastEmptied).toLocaleString() : 'N/A'}
                                                </Popup>
                                            </Circle>
                                        ))
                                    }
                                </LayerGroup>
                            </LayersControl.Overlay>
                        ))
                    }
                </LayersControl>
            </MapContainer>
        </Sheet >
    );
};

export default Map;