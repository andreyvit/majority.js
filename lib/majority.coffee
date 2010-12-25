#! /usr/bin/env coffee

Array_min = (array) -> Math.min.apply(Math, array)

pickWinner = (threshold, votes) ->
  counts = {}
  for vote in votes
    counts[vote] = (counts[vote] || 0) + 1
    if counts[vote] >= threshold
      return vote
  return null

startMajorityElector = (options) ->
  { nodeId: myNodeId, pingInterval, obtainListOfNodes, broadcast, becomeMaster, giveUpMaster, trace } = options

  lastReplies = {}
  nextReplies = {}

  consensusMasterId    = null
  consensusCandidateId = null

  myMasterVote    = null
  myCandidateVote = null

  pingAllNodes = ->
    [lastReplies, nextReplies] = [nextReplies, {}]

    allNodes = obtainListOfNodes()

    allNodesIndexed = {}
    for node in allNodes
      allNodesIndexed[node.nodeId] = node

    # compute consensus votes

    # ignore replies from unlisted nodes
    legitimateReplies = (reply for nodeId, reply of lastReplies when allNodesIndexed[nodeId])

    masterVotes    = (reply.masterVote    for reply in legitimateReplies)
    candidateVotes = (reply.candidateVote for reply in legitimateReplies)

    threshold = allNodes.length / 2  # thank gods, in JavaScript 3 / 2 == 1.5

    previousConsensusMasterId = consensusMasterId
    consensusMasterId    = pickWinner(threshold, masterVotes)
    consensusCandidateId = pickWinner(threshold, candidateVotes)

    if previousConsensusMasterId != consensusMasterId
      if previousConsensusMasterId == myNodeId
        giveUpMaster()
      else if consensusMasterId == myNodeId
        becomeMaster()

    # compute my votes for the next round

    # candidate vote is always for the online node with a minimal id
    onlineNodeIds = (nodeId for nodeId, reply of lastReplies)
    myCandidateVote = if onlineNodeIds.length > 0 then Array_min(onlineNodeIds) else null

    # master vote changes only when the previous master is down
    if !myMasterVote || !lastReplies[myMasterVote]
      myMasterVote = consensusCandidateId

    if trace
      trace { consensusMasterId, consensusCandidateId, myMasterVote, myCandidateVote, replies: legitimateReplies }

    # start the next election
    broadcast(myMasterVote, myCandidateVote)

  incomingPing = (senderId, masterVote, candidateVote) ->
    nextReplies[senderId] = { masterVote, candidateVote }

  interval = setInterval(pingAllNodes, pingInterval)

  shutdown = ->
    if interval
      clearInterval(interval)
      interval = null

  return { incomingPing, shutdown, nodeId: myNodeId }

exports.startMajorityElector = startMajorityElector
