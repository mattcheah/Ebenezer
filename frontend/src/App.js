import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import pages
import JournalList from './pages/JournalList';
import JournalEntry from './pages/JournalEntry';
import PrayerRequests from './pages/PrayerRequests';
import PrayersForMe from './pages/PrayersForMe';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  Ebenezer
                </Typography>
                <Button color="inherit" component={Link} to="/">
                  Journal
                </Button>
                <Button color="inherit" component={Link} to="/prayer-requests">
                  Prayer Requests
                </Button>
                <Button color="inherit" component={Link} to="/prayers-for-me">
                  Prayers for Me
                </Button>
              </Toolbar>
            </AppBar>

            <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Routes>
                <Route path="/" element={<JournalList />} />
                <Route path="/journal/new" element={<JournalEntry />} />
                <Route path="/journal/:id" element={<JournalEntry />} />
                <Route path="/prayer-requests" element={<PrayerRequests />} />
                <Route path="/prayers-for-me" element={<PrayersForMe />} />
              </Routes>
            </Container>

            <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
              <Container maxWidth="sm">
                <Typography variant="body2" color="text.secondary" align="center">
                  © {new Date().getFullYear()} Ebenezer. All rights reserved.
                </Typography>
              </Container>
            </Box>
          </Box>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 