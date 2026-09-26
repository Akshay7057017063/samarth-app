import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/referral/tree
router.get('/tree', authenticateToken, (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find direct downlines where sponsorCode matches this user's userCode
    const directDownlines = store.data.users.filter(u => 
      u.sponsorCode === user.userCode || u.sponsorMemberId === user.memberId
    );

    const leftChildren = directDownlines.filter(u => u.position !== 'right');
    const rightChildren = directDownlines.filter(u => u.position === 'right');

    const tree = {
      id: user._id,
      memberId: user.userCode || user.memberId,
      name: user.name,
      rank: user.rank,
      userType: user.userType,
      leftCount: user.leftCount || leftChildren.length,
      rightCount: user.rightCount || rightChildren.length,
      leftPv: user.leftPv || 60,
      rightPv: user.rightPv || 0,
      leftBusiness: user.leftBusiness || 10800,
      rightBusiness: user.rightBusiness || 0,
      children: directDownlines.map(c => ({
        id: c._id,
        memberId: c.userCode || c.memberId,
        name: c.name,
        rank: c.rank || 'Distributor',
        userType: c.userType || 'UNPAID',
        position: c.position || 'left',
        leftPv: c.leftPv || 0,
        rightPv: c.rightPv || 0,
        children: []
      }))
    };

    res.json({
      success: true,
      tree,
      leftTeam: leftChildren,
      rightTeam: rightChildren
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tree.' });
  }
});

// GET /api/referral/directs
router.get('/directs', authenticateToken, (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
    const directs = store.data.users.filter(u => 
      u.sponsorCode === user?.userCode || u.sponsorMemberId === user?.memberId
    );
    res.json({ success: true, directs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch directs.' });
  }
});

export default router;
