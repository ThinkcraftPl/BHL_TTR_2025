import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
    baseQuery: fetchBaseQuery({ baseUrl: ((import.meta as any).env?.VITE_BACKEND_URL) ?? "http://localhost:3000", credentials: "include" }),
    tagTypes: ["Bins", "BinTypes"],
    endpoints: (builder) => ({
        getBins: builder.query<any[], void>({
            query: () => "/api/bins",
            providesTags: ["Bins"],
        }),
        addBin: builder.mutation<any, {
            location: string;
            type: string;
            fillLevel: number;
            device_mac: number;
            bin_type_id: number;
        }>({
            query: (newBin) => ({
                url: "/api/bins",
                method: "POST",
                body: newBin,
            }),
            invalidatesTags: ["Bins"],
        }),
        getBinTypes: builder.query<any[], void>({
            query: () => "/api/bin_types",
            providesTags: ["BinTypes"],
        }),
        // Additional endpoints can be defined here
    }),
});

export const { useGetBinsQuery, useAddBinMutation } = api;
export const { useGetBinTypesQuery } = api;