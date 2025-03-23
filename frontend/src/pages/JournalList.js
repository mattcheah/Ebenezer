import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function JournalList() {
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/journal-entries/`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  const handleNewEntry = () => {
    navigate('/journal/new');
  };

  const handleEditEntry = (id) => {
    navigate(`/journal/${id}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Journal Entries
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNewEntry}
        >
          New Entry
        </Button>
      </Box>

      <Grid container spacing={3}>
        {entries.map((entry) => (
          <Grid item xs={12} key={entry.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {entry.title || format(new Date(entry.date), 'MMMM d, yyyy')}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {format(new Date(entry.date), 'MMMM d, yyyy')}
                    </Typography>
                    {entry.tags && entry.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {entry.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.content}
                    </Typography>
                  </Box>
                  <Tooltip title="Edit Entry">
                    <IconButton onClick={() => handleEditEntry(entry.id)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleEditEntry(entry.id)}>
                  Read More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default JournalList; 