assert = require 'assert'
{ puts } = require 'sys'
{ startMajorityElector } = require '../lib/majority'

PING_INTERVAL = 100

testMajorityElector = (name, scenario, callback) ->
  nodes = []
  status = {}
  master = {}
  nextNodeId = 1

  puts ""
  puts ""
  puts "Scenario: #{name}"
  add = ->
    [nodeId, nextNodeId] = [nextNodeId, nextNodeId + 1]

    broadcast = (masterVote, candidateVote) ->
      nodeStatus = status[nodeId]
      if nodeStatus != 'offline'
        # puts "#{nodeId} broadcasting a ping"
        for node in nodes
          # puts "#{node.nodeId} pinged by #{nodeId}(#{masterVote}, #{candidateVote})"
          node.incomingPing(nodeId, masterVote, candidateVote)

    becomeMaster = ->
      master[nodeId] = true
      puts ""
      puts "NODE #{nodeId} BECOMES A MASTER"
      puts ""

    giveUpMaster = ->
      master[nodeId] = false
      puts ""
      puts "NODE #{nodeId} NO LONGER A MASTER"
      puts ""

    obtainListOfNodes = ->
      nodes

    trace = (data) ->
      { consensusMasterId, consensusCandidateId, myMasterVote, myCandidateVote, replies } = data
      puts "\##{nodeId}: MM=#{consensusMasterId} CC=#{consensusCandidateId} M=#{myMasterVote} C=#{myCandidateVote}  VOTES #{("<#{reply.masterVote},#{reply.candidateVote}>" for senderId, reply of replies).join(" ")}"

    nodes.push startMajorityElector { nodeId, pingInterval: PING_INTERVAL, broadcast, becomeMaster, giveUpMaster, obtainListOfNodes, trace }
    status[nodeId] = 'online'
    master[nodeId] = false
    return nodeId

  process = (command, nodeId) ->
    switch command
      when 'add'
        ids = []
        for i in [1 .. nodeId]
          ids.push add()
        puts ""
        puts "ADDED NODES #{("#{id}" for id in ids).join(" ")}"
        puts ""
      when 'online'
        puts ""
        puts "NODE #{nodeId} RECOVERS"
        puts ""
        status[nodeId] = 'online'
      when 'offline'
        puts ""
        puts "NODE #{nodeId} CRASHES"
        puts ""
        status[nodeId] = 'offline'
      when 'master'
        puts ""
        puts "assert: #{nodeId} is a master"
        puts ""
        currentMasters = ("#{node.nodeId}" for node in nodes when master[node.nodeId]).join("+")
        expectedMasters = if nodeId then "#{nodeId}" else ""
        assert.equal currentMasters, expectedMasters
      when 'done'
        for node in nodes
          node.shutdown()
        callback() if callback

  scenarioTime = 0
  for item in scenario
    item = item.split(" ")
    item[1] = parseInt(item[1]) if item[1]

    if item[0] == 'wait'
      scenarioTime += item[1]
    else
      setTimeout((-> process(item...)), scenarioTime * PING_INTERVAL)
  setTimeout((-> process('done')), (scenarioTime + 1) * PING_INTERVAL)

test = (tests) ->
  tests = ([name, definition] for name, definition of tests)

  next = ->
    return if tests.length == 0
    test = tests.shift()
    testMajorityElector test[0], test[1], next

  next()

test
  'should elect node 1 when 3 nodes are running without any problems': [
    'add 3'
    'wait 4'
    'master 1'
  ]
  'should switch to node 2 when node 1 becomes offline': [
    'add 3'
    'wait 4'
    'master 1'

    'offline 1'
    'wait 4'
    'master 2'
  ]
  "should not switch to node 1 when it recovers after being offline": [
    'add 3'
    'wait 4'
    'master 1'

    'offline 1'
    'wait 4'
    'master 2'

    'online 1'
    'wait 4'
    'master 2'
  ]
