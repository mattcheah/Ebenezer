import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Collapse,
  Button,
} from '@mui/material';
import { Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_URL = 'http://localhost:8000';

function PrayersForMe() {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [tags, setTags] = useState([]);
  const [newPrayerRequestDialog, setNewPrayerRequestDialog] = useState(false);
  const [newPrayerRequest, setNewPrayerRequest] = useState({
    title: '',
    description: '',
    tags: [],
    is_for_me: true,
  });
  const [newUpdateDialog, setNewUpdateDialog] = useState(false);
  const [selectedPrayerRequest, setSelectedPrayerRequest] = useState(null);
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    content: '',
  });
  const [expandedUpdates, setExpandedUpdates] = useState({});

  useEffect(() => {
    fetchPrayerRequests();
    fetchTags();
  }, []);

  const fetchPrayerRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/prayer-requests/`);
      // Filter only prayers marked as "for me"
      setPrayerRequests(response.data.filter((pr) => pr.is_for_me));
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_URL}/tags/`);
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreatePrayerRequest = async () => {
    try {
      const response = await axios.post(`${API_URL}/prayer-requests/`, newPrayerRequest);
      setPrayerRequests([...prayerRequests, response.data]);
      setNewPrayerRequestDialog(false);
      setNewPrayerRequest({
        title: '',
        description: '',
        tags: [],
        is_for_me: true,
      });
    } catch (error) {
      console.error('Error creating prayer request:', error);
    }
  };

  const handleCreateUpdate = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/prayer-requests/${selectedPrayerRequest.id}/updates/`,
        newUpdate
      );
      setPrayerRequests(
        prayerRequests.map((pr) =>
          pr.id === selectedPrayerRequest.id
            ? { ...pr, updates: [...pr.updates, response.data] }
            : pr
        )
      );
      setNewUpdateDialog(false);
      setNewUpdate({
        title: '',
        content: '',
      });
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };

  const toggleUpdateExpansion = (prayerRequestId) => {
    setExpandedUpdates({
      ...expandedUpdates,
      [prayerRequestId]: !expandedUpdates[prayerRequestId],
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Prayers for Me
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setNewPrayerRequestDialog(true)}
        >
          New Prayer Request
        </Button>
      </Box>

      <Grid container spacing={3}>
        {prayerRequests.map((pr) => (
          <Grid item xs={12} key={pr.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" component="h2">
                      {pr.title}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      Created on {format(new Date(pr.created_at), 'MMMM d, yyyy')}
                    </Typography>
                    {pr.tags && pr.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {pr.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    )}
                    <Typography variant="body1" sx={{ mt: 2 }}>
                      {pr.description}
                    </Typography>
                  </Box>
                  <Tooltip title="Add Update">
                    <IconButton
                      onClick={() => {
                        setSelectedPrayerRequest(pr);
                        setNewUpdateDialog(true);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {pr.updates && pr.updates.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' },
                      }}
                      onClick={() => toggleUpdateExpansion(pr.id)}
                    >
                      <Typography variant="subtitle1">
                        Latest Update: {pr.updates[0].title}
                      </Typography>
                      <ExpandMoreIcon
                        sx={{
                          transform: expandedUpdates[pr.id] ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </Box>
                    <Collapse in={expandedUpdates[pr.id]}>
                      <Box sx={{ mt: 2 }}>
                        {pr.updates.map((update) => (
                          <Box key={update.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {format(new Date(update.date), 'MMMM d, yyyy')}
                            </Typography>
                            <Typography variant="body1">{update.content}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={newPrayerRequestDialog}
        onClose={() => setNewPrayerRequestDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Prayer Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newPrayerRequest.title}
            onChange={(e) =>
              setNewPrayerRequest({
                ...newPrayerRequest,
                title: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newPrayerRequest.description}
            onChange={(e) =>
              setNewPrayerRequest({
                ...newPrayerRequest,
                description: e.target.value,
              })
            }
          />
          <Autocomplete
            multiple
            options={tags}
            getOptionLabel={(option) => option.name}
            value={tags.filter((tag) => newPrayerRequest.tags.includes(tag.id))}
            onChange={(_, newValue) =>
              setNewPrayerRequest({
                ...newPrayerRequest,
                tags: newValue.map((tag) => tag.id),
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="Tags" margin="dense" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPrayerRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePrayerRequest} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newUpdateDialog}
        onClose={() => setNewUpdateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Update to Prayer Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Update Title"
            fullWidth
            value={newUpdate.title}
            onChange={(e) =>
              setNewUpdate({
                ...newUpdate,
                title: e.target.value,
              })
            }
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Update Content
            </Typography>
            <ReactQuill
              value={newUpdate.content}
              onChange={(value) =>
                setNewUpdate({
                  ...newUpdate,
                  content: value,
                })
              }
              style={{ height: '200px', marginBottom: '50px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUpdate} variant="contained">
            Add Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PrayersForMe; 