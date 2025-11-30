import { Box, Button, Card, Input, Option, Select, Sheet, Typography } from "@mui/joy";
import { useState } from "react";
import { useAddBinMutation, useGetBinTypesQuery } from "./api";
import { useNavigate } from "react-router";


type types = 'general' | 'plastic' | 'glass' | 'paper' | 'bio';

const AddBin = () => {
    const [type, setType] = useState<types>('general');
    const [long, setLong] = useState<string>('');
    const [lat, setLat] = useState<string>('');
    const [binType, setBinType] = useState<string>('');
    const [deviceMac, setDeviceMac] = useState<string>('');
    const [addBin] = useAddBinMutation();
    const { data: binTypesData } = useGetBinTypesQuery();
    const navigate = useNavigate();
    return (
        <Sheet sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Card>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <Typography level="body-lg">ID kosza:</Typography>
                    <Input sx={{ width: "200px" }} type="text" value={deviceMac} onChange={(e) => {
                        setDeviceMac(e.target.value)
                    }} />
                </Box>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <Typography level="body-lg">Typ kosza:</Typography>
                    <Select value={type} onChange={(e, value) => setType(value as types)} sx={{ width: "150px" }}>
                        <Option value="general">Ogólny</Option>
                        <Option value="plastic">Plastik</Option>
                        <Option value="glass">Szkło</Option>
                        <Option value="paper">Papier</Option>
                        <Option value="bio">Bio</Option>
                    </Select>
                </Box>
                <Typography level="body-lg">Lokalizacja (lat,lng):</Typography>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <Input disabled sx={{ width: "200px" }} type="text" value={`${lat},${long}`} />
                    <Button variant="outlined" onClick={() => {
                        navigator.geolocation.getCurrentPosition((position) => {
                            console.log(position.coords.latitude, position.coords.longitude);
                            setLat(position.coords.latitude.toPrecision(6));
                            setLong(position.coords.longitude.toPrecision(6));
                        }, (error) => {
                            console.error(error);
                        });
                    }}>Pobierz lokalizację</Button>
                </Box>
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <Typography level="body-lg">Model:</Typography>
                    <Select value={binType} onChange={(e, value) => { if (value) setBinType(value) }} sx={{ width: "150px" }}>
                        {binTypesData?.map((binType) => (
                            <Option key={binType.name} value={binType.name}>{binType.name}</Option>
                        ))}
                    </Select>
                </Box>
                <Button onClick={() => {
                    addBin({
                        type: type,
                        location: `${lat},${long}`,
                        device_mac: Number(deviceMac),
                        bin_type_id: Number(binTypesData?.find(bt => bt.name === binType)?.id),
                        fillLevel: 0
                    }).then(() => {
                        navigate('/map');
                    })

                }}>
                    Dodaj kosz
                </Button>
            </Card>
        </Sheet>
    );
}

export default AddBin;