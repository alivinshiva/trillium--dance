import React, { useState } from 'react';
import { useVideo } from './context/VideoContext';
import { Check, X, Shield, Plus, Calendar, Music, Layers, Search, Trash2, Play, AlertCircle, Edit2, Trophy } from 'lucide-react';
import ScoreModal from './components/ScoreModal';

const App = () => {
  const { getPendingVideos, updateVideoStatus, addChallenge, deleteChallenge, challenges, getPresets, videos } = useVideo();
  const pendingVideos = getPendingVideos();
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'challenges' | 'submissions'

  // Submissions State
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedScoreVideo, setSelectedScoreVideo] = useState(null); // For AI Score Modal
  const [actionVideo, setActionVideo] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'rejected'
  const [adminMessage, setAdminMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openActionModal = (video, type) => {
    setActionVideo(video);
    setActionType(type);
    setAdminMessage('');
  };

  const closeActionModal = () => {
    setActionVideo(null);
    setActionType(null);
    setAdminMessage('');
  };

  const handleActionSubmit = async () => {
    if (!actionVideo || !actionType) return;

    // Revoke/Reject requires message
    if (actionType === 'rejected' && !adminMessage.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 'approve' -> 'approved', 'revoke' -> 'rejected'
      // The button passes 'approve' or 'revoke', actually let's standardise
      // UI passes 'approved' or 'rejected'
      await updateVideoStatus(actionVideo._id, actionType, adminMessage);
      closeActionModal();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort videos for "All Submissions" tab
  const sortedVideos = [...videos].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Challenge Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [newChallenge, setNewChallenge] = useState({
    title: '',
    songUrl: '',
    startDate: '',
    endDate: '',
    tags: [],
    description: '',
    image: null,
    ratingParameters: [
      { name: 'Energy', weight: 10 },
      { name: 'Choreo', weight: 10 },
      { name: 'Sync', weight: 10 }
    ],
    presetComments: { positive: [], neutral: [], negative: [] }
  });

  const [availablePresets, setAvailablePresets] = useState({ positive: [], neutral: [], negative: [] });

  React.useEffect(() => {
    const loadPresets = async () => {
      const presets = await getPresets();
      setAvailablePresets(presets);
    };
    loadPresets();
  }, []);

  const togglePreset = (type, text) => {
    const current = newChallenge.presetComments[type];
    const limit = type === 'positive' ? 4 : 3;

    if (current.includes(text)) {
      // Remove
      setNewChallenge(prev => ({
        ...prev,
        presetComments: {
          ...prev.presetComments,
          [type]: prev.presetComments[type].filter(t => t !== text)
        }
      }));
    } else {
      // Add if under limit
      if (current.length < limit) {
        setNewChallenge(prev => ({
          ...prev,
          presetComments: {
            ...prev.presetComments,
            [type]: [...prev.presetComments[type], text]
          }
        }));
      } else {
        alert(`You can only select ${limit} ${type} comments.`);
      }
    }
  };

  const { updateChallenge } = useVideo();

  /* Rating Parameter Helpers */
  const addRatingParameter = () => {
    setNewChallenge(prev => ({
      ...prev,
      ratingParameters: [...prev.ratingParameters, { name: '', weight: 10 }]
    }));
  };

  const removeRatingParameter = (index) => {
    setNewChallenge(prev => ({
      ...prev,
      ratingParameters: prev.ratingParameters.filter((_, i) => i !== index)
    }));
  };

  const updateRatingParameter = (index, field, value) => {
    const updatedParams = [...newChallenge.ratingParameters];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setNewChallenge(prev => ({ ...prev, ratingParameters: updatedParams }));
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', newChallenge.title);
    formData.append('songUrl', newChallenge.songUrl);
    formData.append('startDate', newChallenge.startDate);
    formData.append('endDate', newChallenge.endDate);
    formData.append('description', newChallenge.description);
    // Send info as JSON strings
    formData.append('tags', JSON.stringify(newChallenge.tags));
    formData.append('ratingParameters', JSON.stringify(newChallenge.ratingParameters));
    formData.append('presetComments', JSON.stringify(newChallenge.presetComments));

    if (newChallenge.image instanceof File) {
      formData.append('image', newChallenge.image);
    }

    try {
      if (isEditing) {
        await updateChallenge(editingId, formData);
        alert('Challenge Updated!');
        setIsEditing(false);
        setEditingId(null);
      } else {
        await addChallenge(formData);
        alert('Challenge Created!');
      }

      setNewChallenge({
        title: '',
        songUrl: '',
        startDate: '',
        endDate: '',
        tags: [],
        description: '',
        image: null,
        ratingParameters: [
          { name: 'Energy', weight: 10 },
          { name: 'Choreo', weight: 10 },
          { name: 'Sync', weight: 10 }
        ],
        presetComments: { positive: [], neutral: [], negative: [] }
      });
    } catch (error) {
      console.error(error);
      alert('Failed to save challenge');
    }
  };

  const handleEditClick = (challenge) => {
    setIsEditing(true);
    setEditingId(challenge._id);
    setNewChallenge({
      title: challenge.title,
      songUrl: challenge.songUrl,
      startDate: challenge.startDate ? new Date(challenge.startDate).toISOString().split('T')[0] : '',
      endDate: challenge.endDate ? new Date(challenge.endDate).toISOString().split('T')[0] : '',
      tags: challenge.tags || [],
      description: challenge.description,
      image: challenge.image, // Keep existing URL reference
      ratingParameters: challenge.ratingParameters || [
        { name: 'Energy', weight: 10 },
        { name: 'Choreo', weight: 10 },
        { name: 'Sync', weight: 10 }
      ],
      presetComments: challenge.presetComments || { positive: [], neutral: [], negative: [] }
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewChallenge({
      title: '',
      songUrl: '',
      startDate: '',
      endDate: '',
      tags: [],
      description: '',
      image: null,
      ratingParameters: [
        { name: 'Energy', weight: 10 },
        { name: 'Choreo', weight: 10 },
        { name: 'Sync', weight: 10 }
      ],
      presetComments: { positive: [], neutral: [], negative: [] }
    });
  };



  return (
    <div className="min-h-screen bg-dark-lighter text-white pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Admin Command Center</h1>
            <p className="text-white/50">Manage submissions and create new challenges</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-2 font-bold text-sm transition-colors ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-white/40 hover:text-white'}`}
          >
            Pending Reviews ({pendingVideos.length})
          </button>
          <button
            onClick={() => setActiveTab('challenges')}
            className={`pb-4 px-2 font-bold text-sm transition-colors ${activeTab === 'challenges' ? 'text-primary border-b-2 border-primary' : 'text-white/40 hover:text-white'}`}
          >
            Challenge Manager
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-4 px-2 font-bold text-sm transition-colors ${activeTab === 'submissions' ? 'text-primary border-b-2 border-primary' : 'text-white/40 hover:text-white'}`}
          >
            All Submissions
          </button>
        </div>

        {activeTab === 'submissions' ? (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-white/5 text-white/60 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Challenge</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4 text-center">Video</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedVideos.map(video => (
                  <tr key={video._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white/60">
                      {new Date(video.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {video.userAvatar && (
                          <img src={video.userAvatar} alt="" className="w-8 h-8 rounded-full bg-white/10" />
                        )}
                        <div>
                          <div className="font-bold">{video.userName}</div>
                          <div className="text-xs text-white/40">ID: {video.userId ? video.userId.slice(-4) : 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-white/80">{video.city || '-'}</td>
                    <td className="p-4 text-primary font-medium">
                      {video.challengeId ? video.challengeId.title : <span className="text-white/30 italic">Unknown / Deleted</span>}
                    </td>
                    <td className="p-4">
                      {video.aiRating && video.aiRating.final_grid_index ? (
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedScoreVideo(video);
                          }}
                        >
                          <span className={`font-bold ${video.aiRating.final_grid_index >= 8.5 ? 'text-green-400' :
                            video.aiRating.final_grid_index >= 7.0 ? 'text-yellow-400' : 'text-white/60'
                            }`}>
                            {video.aiRating.final_grid_index.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-white/30">/ 10</span>
                        </div>
                      ) : (
                        <span className="text-white/20 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all mx-auto"
                      >
                        <Play size={16} fill="currentColor" />
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${video.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        video.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {video.status !== 'approved' && (
                          <button
                            onClick={() => openActionModal(video, 'approved')}
                            className="p-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500 hover:text-white transition-colors"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        {video.status !== 'rejected' && (
                          <button
                            onClick={() => openActionModal(video, 'rejected')}
                            className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                            title="Revoke/Reject"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedVideos.length === 0 && (
              <div className="p-12 text-center text-white/40">
                No submissions found.
              </div>
            )}
          </div>
        ) : activeTab === 'reviews' ? (
          pendingVideos.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
              <p className="text-white/50">There are no pending videos to review at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingVideos.map((video) => (
                <div key={video._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-black group">
                    <video src={video.videoUrl} className="w-full h-full object-cover" controls />
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">PENDING REVIEW</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={video.userAvatar} alt={video.userName} className="w-10 h-10 rounded-full border border-white/20" />
                      <div>
                        <h4 className="font-bold text-sm">{video.userName}</h4>
                        <span className="text-xs text-white/40">Uploaded {new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {video.description && (
                      <p className="text-sm text-white/60 mb-6 line-clamp-2">{video.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button
                        onClick={() => openActionModal(video, 'rejected')}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-semibold text-sm"
                      >
                        <X size={16} /> Revoke
                      </button>
                      <button
                        onClick={() => openActionModal(video, 'approved')}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors font-semibold text-sm"
                      >
                        <Check size={16} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            {/* Create Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Plus size={20} className="text-primary" /> {isEditing ? 'Edit Challenge' : 'Create New Challenge'}
                </h2>
                {isEditing && (
                  <button onClick={handleCancelEdit} className="text-xs text-white/50 hover:text-white bg-white/10 px-3 py-1 rounded">
                    Cancel Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleChallengeSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Challenge Title</label>
                  <input
                    type="text"
                    required
                    value={newChallenge.title}
                    onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                    placeholder="e.g. Neon Nights Dance Off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setNewChallenge({ ...newChallenge, image: e.target.files[0] })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/80 transition-all cursor-pointer"
                  />
                  <p className="text-[10px] text-white/30 mt-1">Upload a high-quality banner for the main app display.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/50 mb-2">Song URL</label>
                    <div className="relative">
                      <Music size={16} className="absolute left-3 top-3.5 text-white/30" />
                      <input
                        type="text"
                        required
                        value={newChallenge.songUrl}
                        onChange={e => setNewChallenge({ ...newChallenge, songUrl: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:border-primary focus:outline-none"
                        placeholder="/1.webm (local) or https://..."
                      />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">Use <code>/1.webm</code> for the demo file.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-white/50 mb-2">Duration</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={newChallenge.startDate}
                        onChange={e => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-3 text-white focus:border-primary focus:outline-none text-xs"
                      />
                      <input
                        type="date"
                        required
                        value={newChallenge.endDate}
                        onChange={e => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-3 text-white focus:border-primary focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Challenge Tags (Select Max 10)</label>
                  <div className="flex flex-wrap gap-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {[
                      "DanceVideo", "DanceLife", "Choreography", "DanceReels", "InstaDance",
                      "StreetDance", "StudioDance", "FreestyleDance", "HipHopDance", "UrbanDance",
                      "DanceVibes", "FeelTheBeat", "GrooveTime", "DanceFlow", "JustDance",
                      "ContemporaryDance", "DancePerformance", "BeatDrop", "MoveWithMusic", "DancerVibes",
                      "Popping", "Locking", "Krump", "Waacking", "Vogue",
                      "Salsa", "Bachata", "Tango", "Bollywood", "Classical",
                      "Jazz", "Ballet", "TapDance", "Lyrical", "ModernDance"
                    ].map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (newChallenge.tags.includes(tag)) {
                            setNewChallenge({ ...newChallenge, tags: newChallenge.tags.filter(t => t !== tag) });
                          } else {
                            if (newChallenge.tags.length < 10) {
                              setNewChallenge({ ...newChallenge, tags: [...newChallenge.tags, tag] });
                            } else {
                              alert("Max 10 tags allowed");
                            }
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${newChallenge.tags.includes(tag)
                          ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                          : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/10'
                          }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Selected: {newChallenge.tags.length}/10. These tags will be available for users.</p>
                </div>

                {/* Rating Parameters Section */}
                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Rating Parameters</label>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    {newChallenge.ratingParameters.map((param, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Parameter Name (e.g. Energy)"
                          value={param.name}
                          onChange={(e) => updateRatingParameter(index, 'name', e.target.value)}
                          className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        />
                        <select
                          value={param.weight}
                          onChange={(e) => updateRatingParameter(index, 'weight', parseInt(e.target.value))}
                          className="w-24 bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-white focus:border-primary focus:outline-none"
                        >
                          {[5, 10, 15, 20, 25, 30, 40, 50].map(w => (
                            <option key={w} value={w}>Weight: {w}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeRatingParameter(index)}
                          className="text-red-500 hover:text-red-400 p-2 hover:bg-white/10 rounded"
                          disabled={newChallenge.ratingParameters.length <= 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRatingParameter}
                      className="text-xs font-bold text-primary hover:text-white flex items-center gap-1 mt-2"
                    >
                      <Plus size={14} /> Add Parameter
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Set the criteria users will rate on. Higher weight means more impact.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Preset Comments (Select for Quick Chips)</label>



                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Debug Info */}
                    {availablePresets.positive.length === 0 && (
                      <div className="col-span-3 text-red-400 text-xs mb-2">
                        No presets loaded. Check console for details. (Length: 0)
                      </div>
                    )}
                    {/* Positive */}
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="flex justify-between font-bold text-green-400 mb-2 text-xs uppercase tracking-wider">
                        Positive <span>{newChallenge.presetComments.positive.length}/4</span>
                      </h4>
                      <div className="space-y-2 h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {availablePresets.positive.map((text, i) => (
                          <div key={i}
                            onClick={() => togglePreset('positive', text)}
                            className={`text-xs p-2 rounded cursor-pointer transition-colors border ${newChallenge.presetComments.positive.includes(text)
                              ? 'bg-green-500/20 border-green-500 text-white'
                              : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/10'
                              }`}>
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Neutral */}
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="flex justify-between font-bold text-yellow-400 mb-2 text-xs uppercase tracking-wider">
                        Neutral <span>{newChallenge.presetComments.neutral.length}/3</span>
                      </h4>
                      <div className="space-y-2 h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {availablePresets.neutral.map((text, i) => (
                          <div key={i}
                            onClick={() => togglePreset('neutral', text)}
                            className={`text-xs p-2 rounded cursor-pointer transition-colors border ${newChallenge.presetComments.neutral.includes(text)
                              ? 'bg-yellow-500/20 border-yellow-500 text-white'
                              : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/10'
                              }`}>
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Negative */}
                    <div className="bg-white/5 p-4 rounded-xl">
                      <h4 className="flex justify-between font-bold text-red-400 mb-2 text-xs uppercase tracking-wider">
                        Negative <span>{newChallenge.presetComments.negative.length}/3</span>
                      </h4>
                      <div className="space-y-2 h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {availablePresets.negative.map((text, i) => (
                          <div key={i}
                            onClick={() => togglePreset('negative', text)}
                            className={`text-xs p-2 rounded cursor-pointer transition-colors border ${newChallenge.presetComments.negative.includes(text)
                              ? 'bg-red-500/20 border-red-500 text-white'
                              : 'bg-black/20 border-white/5 text-white/50 hover:bg-white/10'
                              }`}>
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-white/50 mb-2">Description</label>
                  <textarea
                    required
                    value={newChallenge.description}
                    onChange={e => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none h-24 resize-none"
                    placeholder="Brief description of the challenge rules..."
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full py-4 text-sm font-bold tracking-widest uppercase">
                  {isEditing ? 'Update Challenge' : 'Launch Challenge'}
                </button>
              </form>
            </div>

            {/* Existing Challenges List */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Layers size={20} className="text-white/60" /> Active Challenges
              </h2>
              <div className="space-y-4">
                {challenges.map(challenge => (
                  <div key={challenge._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group">
                    {/* Image Banner */}
                    <div className="relative h-32 bg-black/40">
                      {challenge.coverUrl ? (
                        <img src={challenge.coverUrl} alt={challenge.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Trophy size={32} className="text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold backdrop-blur-md border border-green-500/10">ACTIVE</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{challenge.title}</h3>
                      <p className="text-xs text-white/50 mb-3 line-clamp-2">{challenge.description}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {challenge.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">#{tag}</span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          <Calendar size={12} />
                          <span>{new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(challenge)}
                            className="text-primary hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Edit Challenge"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
                                deleteChallenge(challenge._id);
                              }
                            }}
                            className="text-red-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Delete Challenge"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Score Modal */}
        <ScoreModal
          isOpen={!!selectedScoreVideo}
          onClose={() => setSelectedScoreVideo(null)}
          aiRating={selectedScoreVideo?.aiRating}
        />

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/20"
              >
                <X size={18} />
              </button>
              <video
                src={selectedVideo.videoUrl}
                className="w-full h-full object-cover"
                controls
                autoPlay
              />
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <h3 className="font-bold text-shadow text-white">@{selectedVideo.userName}</h3>
                <p className="text-sm opacity-80 line-clamp-2 text-white">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Modal (Approve/Revoke) */}
        {actionVideo && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    {actionType === 'approved' ? (
                      <><Check className="text-green-500" /> Approve Submission</>
                    ) : (
                      <><AlertCircle className="text-red-500" /> Revoke Submission</>
                    )}
                  </h3>
                  <p className="text-white/40 text-sm mt-1">
                    {actionType === 'approved'
                      ? `Make @${actionVideo.userName}'s video public.`
                      : `Return @${actionVideo.userName}'s video to drafts.`}
                  </p>
                </div>
                <button onClick={closeActionModal} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  {actionType === 'approved' ? 'Message (Optional)' : 'Reason for Revocation (Required)'}
                </label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder={actionType === 'approved' ? "Ex: Great energy! Welcome to ShowGrid." : "Ex: Video is too dark / Audio is unclear."}
                  className={`w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary min-h-[100px] resize-none ${actionType === 'rejected' && !adminMessage.trim() ? 'border-red-500/50' : ''
                    }`}
                />
                {actionType === 'rejected' && !adminMessage.trim() && (
                  <p className="text-red-500 text-xs mt-2">* A reason is required for revocation.</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeActionModal}
                  className="flex-1 py-3 rounded-lg font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionSubmit}
                  disabled={isSubmitting || (actionType === 'rejected' && !adminMessage.trim())}
                  className={`flex-1 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${actionType === 'approved'
                    ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
                    : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Processing...' : (actionType === 'approved' ? 'Approve' : 'Revoke')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
