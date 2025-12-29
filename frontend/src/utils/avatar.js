import axios from 'axios'

export const uploadAvatar = async (userId, file) => {
  const formData = new FormData()
  formData.append('user_id', userId)
  formData.append('file', file)
  const res = await axios.post('/api/profile/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
