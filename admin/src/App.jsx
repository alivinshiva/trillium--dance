import React, { useState } from 'react';
import { useVideo } from './context/VideoContext';
import { Check, X, Shield, Plus, Calendar, Music, Layers, Search, Trash2 } from 'lucide-react';

const App = () => {
  const { getPendingVideos, updateVideoStatus, addChallenge, deleteChallenge, challenges, getPresets } = useVideo();
  const pendingVideos = getPendingVideos();
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'challenges'

  // Challenge Form State
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    songUrl: '',
    startDate: '',
    endDate: '',
    tags: ['Energy', 'Choreo', 'Sync', 'Vibe'],
    description: '',
    image: null,
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
    formData.append('presetComments', JSON.stringify(newChallenge.presetComments));

    if (newChallenge.image) {
      formData.append('image', newChallenge.image);
    }

    await addChallenge(formData);

    setNewChallenge({
      title: '',
      songUrl: '',
      startDate: '',
      endDate: '',
      tags: ['', '', '', ''],
      description: '',
      image: null,
      presetComments: { positive: [], neutral: [], negative: [] }
    });
    alert('Challenge Created!');
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
        </div>

        {activeTab === 'reviews' ? (
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
                        onClick={() => updateVideoStatus(video._id, 'rejected')}
                        className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors font-semibold text-sm"
                      >
                        <X size={16} /> Revoke
                      </button>
                      <button
                        onClick={() => updateVideoStatus(video._id, 'approved')}
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
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus size={20} className="text-primary" /> Create New Challenge
              </h2>
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
                  Launch Challenge
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
                  <div key={challenge.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{challenge.title}</h3>
                      <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded font-bold">ACTIVE</span>
                    </div>
                    <p className="text-xs text-white/50 mb-4 line-clamp-2">{challenge.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {challenge.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/70">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        <Calendar size={12} />
                        <span>{new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}</span>
                      </div>
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
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
