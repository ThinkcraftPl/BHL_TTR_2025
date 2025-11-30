import { useState } from 'react'
import { Box, Sheet, Typography } from '@mui/joy'
import BinList from './BinList'
import { NavLink, Route, Routes } from 'react-router'
import Map from './Map';
import AddBin from './Add';

const navLinkStyles = function ({ isActive }: { isActive: boolean }) {
  return ({
    color: 'var(--joy-palette-text-primary)',
    textDecoration: 'none',
    fontWeight: isActive ? 'bold' : 'normal',
    padding: '5px 10px'
  });
};

function App() {

  return (
    <>
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: "50px",
        color: (theme) => theme.palette.text.primary,
        backgroundColor: (theme) => theme.palette.background.menu,
        padding: "5px",
        margin: "0px",
        position: "sticky",
        top: "0px",
        zIndex: 1000,
      }}>
        <Typography level="h4">
          Chytry Śmietnik
        </Typography>
        <nav>
          <NavLink to="/" style={navLinkStyles}>
            Bin List
          </NavLink>
          <NavLink to="/map" style={navLinkStyles}>
            Map View
          </NavLink>
          <NavLink to="/add" style={navLinkStyles}>
            Add Bin
          </NavLink>
        </nav>
      </Box>
      <Box sx={{ width: "100vw", padding: 0, margin: 0, height: "calc(100vh - 50px)", overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Routes>
          <Route path="/" element={<BinList />} />
          <Route path="map" element={<Map />} />
          <Route path="add" element={<AddBin />} />
        </Routes>
      </Box>
    </>
  )
}

export default App
