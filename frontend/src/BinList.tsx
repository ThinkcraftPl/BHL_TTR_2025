import { useEffect } from "react";
import { useGetBinsQuery, useGetBinTypesQuery } from "./api";
import { Card, Grid, Typography } from "@mui/joy";


const BinList = () => {
    const { data: binsData } = useGetBinsQuery();
    useEffect(() => {
        console.log("Bins data:", binsData);
    }, [binsData]);
    return (
        <Grid container spacing={2} sx={{ width: "100%", padding: 2 }} columns={4}>
            {binsData &&
                binsData.map((bin) => (
                    <Grid xs={4} sm={2} md={1} key={bin.id}>
                        <Card key={bin.id} variant="outlined">
                            <Typography level="h3">
                                Bin at {bin.location}
                            </Typography>
                            <Typography>
                                Fill Level: {bin.fillLevel}%
                            </Typography>
                            <Typography>
                                Temperature: {bin.temperature ?? 'N/A'} °C
                            </Typography>
                            <Typography>
                                Humidity: {bin.humidity ?? 'N/A'} %
                            </Typography>
                            <Typography>
                                Pollution: {bin.pollution ?? 'N/A'}
                            </Typography>
                            <Typography>
                                Alarm: {bin.alarm ? 'Yes' : 'No'}
                            </Typography>
                            <Typography>
                                Last Emptied: {bin.lastEmptied ? new Date(bin.lastEmptied).toLocaleString() : 'N/A'}
                            </Typography>
                            <Typography>
                                Type: {bin.type}
                            </Typography>

                        </Card>
                    </Grid>
                ))
            }
        </Grid>
    );
}

export default BinList;