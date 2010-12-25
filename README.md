Majority election for the cloud
===============================

This package helps you elect a master node among a set of identical nodes (say, electing a master database server among the servers running the database in your cloud, or the master load-balancer server).

See `test/test_majority.coffee` for usage example.


Consensus protocol
------------------

The idea is to elect an online node with a minimal ID as a master. (If you use IP addressed as node IDs, which you should, then a node with a lexicographically smallest IP address wins.)

To implement this idea, there are a few complications to take care of:

* Getting the nodes to agree which one of them is a node with a minimal ID.

    Solution: Each node broadcasts its vote on who should be elected. Each node also received the broadcasts, counts votes and picks a winner based on a majority consensus. The incoming broadcasts are also used to judge whether peer nodes are online or offline.

* If there's a “network split” (a conditions when two or more groups of nodes are online, but cannot communicate across groups), we have to avoid picking several master nodes.

    Solution: There must be a known list of all nodes, and for a winner to be elected, more than N/2 votes are required (where N is the total number of nodes, not a number of nodes that voted).

* When nodes with small IDs come back online, master may be re-elected even though the old one is perfectly capable of functioning. In the worst case, if the node with a minimal ID is unstable (goes offline and back online often), the whole system may be disrupted by frequent re-elections.

    Solution: Only re-elect a master when the old one is offline. To do it, there are two separate elections going on: one which goes as described and picks a “candidate” (the node to become a master when the current master goes offline), and another one that picks the actual master.

    A node always gives candidate vote to the online node with a smallest ID. The master vote is kept unchanged until the current master goes online, in which case the *currently elected candidate* becomes the new master vote (i.e. a node only updates its master vote to the candidate which has been elected by the candidate election prior to that moment).

    Both master and candidate elections happen on every broadcast (e.g. every 5 seconds), but master votes only change when the old master goes away, so the master is not re-elected until necessary

* Which nodes to consider offline?

    For now, a node is considered offline if no broadcast has been received from it during the period between two broadcasts. This is an area that could obviously use some improvement, but even this simple rule is good enough.

The algorithm is very simple, avoid special-casing the “current node” in any way (it also assumes that a node receives its own broadcasts), and cannot possibly re-elect a master unless a majority of nodes decide that such re-election is needed.


Status
------

This code HAS NOT been used in a real-world application yet — it was certainly written with such use in mind, but I still need to cover some more basic stuff in my cloud stack before I get to the monitoring service.


Installation
------------

Will be released as an NPM package once it gets some real-world testing.


Thanks
------

Martin v. Löwis, Spike Gronim and Nick Johnson for the answers on my StackOverflow question [How to elect a master node among the nodes running in a cluster?](http://stackoverflow.com/questions/4523185/how-to-elect-a-master-node-among-the-nodes-running-in-a-cluster)


License
-------

MIT license.
