import React from "react";
import { Box, Typography } from "@mui/material";

interface TitleBarProps {
  title?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({ title }) => {
  return (
    <Box
      sx={{
        WebkitAppRegion: "drag",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 38,
        bgcolor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
        px: 2,
      }}
    >
      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
        {title || "Chopr"}
      </Typography>
    </Box>
  );
};

export default TitleBar;
