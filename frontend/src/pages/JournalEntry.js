import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Autocomplete,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import axios from 'axios';
import debounce from 'debounce';

const API_URL = 'http://localhost:8000';

function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState({
    title: '',
    date: new Date(),
    bible_verses: '',
    content: '',
    tags: [],
    prayer_requests: [],
  });
  const [tags, setTags] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [newTagDialog, setNewTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newPrayerRequestDialog, setNewPrayerRequestDialog] = useState(false);
  const [newPrayerRequest, setNewPrayerRequest] = useState({
    title: '',
    description: '',
    tags: [],
  });

  useEffect(() => {
    fetchTags();
    fetchPrayerRequests();
    if (id && id !== 'new') {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      const response = await axios.get(`${API_URL}/journal-entries/${id}`);
      setEntry(response.data);
    } catch (error) {
      console.error('Error fetching journal entry:', error);
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

  const fetchPrayerRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/prayer-requests/`);
      setPrayerRequests(response.data);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (id && id !== 'new') {
        await axios.put(`${API_URL}/journal-entries/${id}`, entry);
      } else {
        await axios.post(`${API_URL}/journal-entries/`, entry);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await axios.post(`${API_URL}/tags/`, { name: newTag });
      setTags([...tags, response.data]);
      setEntry({
        ...entry,
        tags: [...entry.tags, response.data.id],
      });
      setNewTagDialog(false);
      setNewTag('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleCreatePrayerRequest = async () => {
    try {
      const response = await axios.post(`${API_URL}/prayer-requests/`, newPrayerRequest);
      setPrayerRequests([...prayerRequests, response.data]);
      setEntry({
        ...entry,
        prayer_requests: [...entry.prayer_requests, response.data.id],
      });
      setNewPrayerRequestDialog(false);
      setNewPrayerRequest({
        title: '',
        description: '',
        tags: [],
      });
    } catch (error) {
      console.error('Error creating prayer request:', error);
    }
  };

  const debouncedSave = debounce(handleSave, 1000);

  const handleChange = (field, value) => {
    setEntry({ ...entry, [field]: value });
    debouncedSave();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {id === 'new' ? 'New Journal Entry' : 'Edit Journal Entry'}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
        </Typography>

        <TextField
          fullWidth
          label="Title"
          value={entry.title}
          onChange={(e) => handleChange('title', e.target.value)}
          margin="normal"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {entry.tags.map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              return tag ? (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onDelete={() =>
                    handleChange(
                      'tags',
                      entry.tags.filter((t) => t !== tagId)
                    )
                  }
                />
              ) : null;
            })}
            <Tooltip title="Add New Tag">
              <IconButton onClick={() => setNewTagDialog(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Autocomplete
            multiple
            options={tags}
            getOptionLabel={(option) => option.name}
            value={tags.filter((tag) => entry.tags.includes(tag.id))}
            onChange={(_, newValue) =>
              handleChange(
                'tags',
                newValue.map((tag) => tag.id)
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Tags" />
            )}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Prayer Requests
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {entry.prayer_requests.map((prId) => {
              const pr = prayerRequests.find((p) => p.id === prId);
              return pr ? (
                <Chip
                  key={pr.id}
                  label={pr.title}
                  onDelete={() =>
                    handleChange(
                      'prayer_requests',
                      entry.prayer_requests.filter((p) => p !== prId)
                    )
                  }
                />
              ) : null;
            })}
            <Tooltip title="Add New Prayer Request">
              <IconButton onClick={() => setNewPrayerRequestDialog(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Autocomplete
            multiple
            options={prayerRequests}
            getOptionLabel={(option) => option.title}
            value={prayerRequests.filter((pr) =>
              entry.prayer_requests.includes(pr.id)
            )}
            onChange={(_, newValue) =>
              handleChange(
                'prayer_requests',
                newValue.map((pr) => pr.id)
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Select Prayer Requests" />
            )}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Bible Verses
          </Typography>
          <ReactQuill
            value={entry.bible_verses}
            onChange={(value) => handleChange('bible_verses', value)}
            style={{ height: '150px', marginBottom: '50px' }}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Journal Entry
          </Typography>
          <ReactQuill
            value={entry.content}
            onChange={(value) => handleChange('content', value)}
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </Box>
      </Paper>

      <Dialog open={newTagDialog} onClose={() => setNewTagDialog(false)}>
        <DialogTitle>Add New Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTagDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTag} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newPrayerRequestDialog}
        onClose={() => setNewPrayerRequestDialog(false)}
      >
        <DialogTitle>Add New Prayer Request</DialogTitle>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPrayerRequestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePrayerRequest} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default JournalEntry; 