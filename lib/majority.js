(function() {
  var Array_min, pickWinner, startMajorityElector;
  var __hasProp = Object.prototype.hasOwnProperty;
  Array_min = function(array) {
    return Math.min.apply(Math, array);
  };
  pickWinner = function(threshold, votes) {
    var _i, _len, _ref, counts, vote;
    counts = {};
    _ref = votes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vote = _ref[_i];
      counts[vote] = (counts[vote] || 0) + 1;
      if (counts[vote] >= threshold) {
        return vote;
      }
    }
    return null;
  };
  startMajorityElector = function(options) {
    var _ref, becomeMaster, broadcast, consensusCandidateId, consensusMasterId, giveUpMaster, incomingPing, interval, lastReplies, myCandidateVote, myMasterVote, myNodeId, nextReplies, obtainListOfNodes, pingAllNodes, pingInterval, shutdown, trace;
    _ref = options;
    myNodeId = _ref.nodeId;
    pingInterval = _ref.pingInterval;
    obtainListOfNodes = _ref.obtainListOfNodes;
    broadcast = _ref.broadcast;
    becomeMaster = _ref.becomeMaster;
    giveUpMaster = _ref.giveUpMaster;
    trace = _ref.trace;
    lastReplies = {};
    nextReplies = {};
    consensusMasterId = null;
    consensusCandidateId = null;
    myMasterVote = null;
    myCandidateVote = null;
    pingAllNodes = function() {
      var _i, _len, _ref2, _result, allNodes, allNodesIndexed, candidateVotes, legitimateReplies, masterVotes, node, nodeId, onlineNodeIds, previousConsensusMasterId, reply, threshold;
      _ref2 = [nextReplies, {}];
      lastReplies = _ref2[0];
      nextReplies = _ref2[1];
      allNodes = obtainListOfNodes();
      allNodesIndexed = {};
      _ref2 = allNodes;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        allNodesIndexed[node.nodeId] = node;
      }
      legitimateReplies = (function() {
        _result = []; _ref2 = lastReplies;
        for (nodeId in _ref2) {
          if (!__hasProp.call(_ref2, nodeId)) continue;
          reply = _ref2[nodeId];
          if (allNodesIndexed[nodeId]) {
            _result.push(reply);
          }
        }
        return _result;
      })();
      masterVotes = (function() {
        _result = []; _ref2 = legitimateReplies;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          reply = _ref2[_i];
          _result.push(reply.masterVote);
        }
        return _result;
      })();
      candidateVotes = (function() {
        _result = []; _ref2 = legitimateReplies;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          reply = _ref2[_i];
          _result.push(reply.candidateVote);
        }
        return _result;
      })();
      threshold = allNodes.length / 2;
      previousConsensusMasterId = consensusMasterId;
      consensusMasterId = pickWinner(threshold, masterVotes);
      consensusCandidateId = pickWinner(threshold, candidateVotes);
      if (previousConsensusMasterId !== consensusMasterId) {
        if (previousConsensusMasterId === myNodeId) {
          giveUpMaster();
        } else if (consensusMasterId === myNodeId) {
          becomeMaster();
        }
      }
      onlineNodeIds = (function() {
        _result = []; _ref2 = lastReplies;
        for (nodeId in _ref2) {
          if (!__hasProp.call(_ref2, nodeId)) continue;
          reply = _ref2[nodeId];
          _result.push(nodeId);
        }
        return _result;
      })();
      myCandidateVote = onlineNodeIds.length > 0 ? Array_min(onlineNodeIds) : null;
      if (!myMasterVote || !lastReplies[myMasterVote]) {
        myMasterVote = consensusCandidateId;
      }
      if (trace) {
        trace({
          consensusMasterId: consensusMasterId,
          consensusCandidateId: consensusCandidateId,
          myMasterVote: myMasterVote,
          myCandidateVote: myCandidateVote,
          replies: legitimateReplies
        });
      }
      return broadcast(myMasterVote, myCandidateVote);
    };
    incomingPing = function(senderId, masterVote, candidateVote) {
      return (nextReplies[senderId] = {
        masterVote: masterVote,
        candidateVote: candidateVote
      });
    };
    interval = setInterval(pingAllNodes, pingInterval);
    shutdown = function() {
      if (interval) {
        clearInterval(interval);
        return (interval = null);
      }
    };
    return {
      incomingPing: incomingPing,
      shutdown: shutdown,
      nodeId: myNodeId
    };
  };
  exports.startMajorityElector = startMajorityElector;
}).call(this);
