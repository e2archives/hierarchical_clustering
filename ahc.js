(function(exports){
  'use strict';

  module.exports = {
    DistanceFunctions:{
      EuclideanSq: EuclideanSq,
      Euclidean: Euclidean,
      Manhattan: Manhattan,
      MaxDist: MaxDist,
      Hamming: Hamming,
      Levenshtein: Levenshtein
    },
    ClusterType: {
      UPGMC: UPGMC
    },
    cluster: cluster
  };

  // cluster
  function cluster(nodes, clusterType, fn_dist, fn_centroid, accessor){
    var pts = (accessor)?nodes.map(accessor):nodes;
    var result = clusterType(pts,fn_dist,fn_centroid);
    return result[0];
  }
  
  // append nodes into results
  function appendData(children,nodes,level){
    return children.map(function(d){
      if (typeof(d) == "number") return {level:level,value:nodes[d]};
      else return {level:level,children:appendData(d,nodes,level-1)};
    })
  }
  
    // append nodes into results
  function populateData(branch,nodes){
    branch.children = branch.children.map(function(d){
      if (typeof(d) == "number") return {level:level,value:nodes[d]};
      else return {level:level,children:populateData(d,nodes,level-1)};
    })
  }
  
  // Agglomerative
  // Unweighted Pair-Group Method using Centroids
  function UPGMC(pts, fn_dist, fn_centroid){
    fn_dist = fn_dist || EuclideanSq;
    fn_centroid = fn_centroid || calcCentroid;
    
    var dist_pairs = [], result = [], stack = pts.map(function(d,i){return i;}), centroids = pts.map(function(d,i){return {level:0,children:i,family:[i]};});
    
    // calc dist_pairs
    pts.forEach(function(pt1,i){
      pts.forEach(
        function(pt2,j){
          if (pt1 != pt2) dist_pairs.push({level:1,family:[i,j],children:[i,j],pair:[i,j],cost:fn_dist(pt1,pt2)});
        }
      )
    })
    
    while(dist_pairs.length > 0)
    {
      // sort
      dist_pairs.sort(function(a,b){return b.cost - a.cost;});
      
      // merge
      var pair = dist_pairs.pop();
      result.push(pair);
      
      // take out dist for the pair
      stack = stack.filter(function(d){return (d!=pair.pair[0] && d!=pair.pair[1]);});
      dist_pairs = dist_pairs.filter(	
        function(d){ 
          for (var i=0,len=d.pair.length; i<len; ++i){
            if (pair.pair.indexOf(d.pair[i]) >= 0) return false;
          }
          return true;
        });
      
      // calc centroid for new cluster
      var centroid = fn_centroid(pts[pair.pair[0]],pts[pair.pair[1]]);
      pts.push(centroid);
      centroids.push(pair);

      var clusterId = pts.length-1;
      // recalc dist for new cluster
      stack.forEach(function(d){
        var _pair = (centroids[d].family || [d]).concat(centroids[clusterId].family || [clusterId]);
        //dist_pairs.push({level:Math.max(pair.level,centroids[d].level)+1,children:[pair.children,centroids[d].children],pair:[clusterId,d],cost:fn_dist(centroid,pts[d])})
        dist_pairs.push({level:Math.max(pair.level,centroids[d].level)+1,children:[pair,centroids[d]],family:_pair,pair:[clusterId,d],cost:fn_dist(centroid,pts[d])})
      })
      // push centroid into stack queue
      stack.push(clusterId);
    }
    
    return result.sort(function(a,b){return b.level-a.level;});
  }

  function calcCentroid(pt1,pt2){
    return pt1.map(function(d,i){
      return 0.5*(d+pt2[i]);
    })
  }

  function EuclideanSq(v1,v2){
    var sum = 0;
    v1.forEach(function(d,i){
      sum += (d-v2[i])*(d-v2[i]);
    })
    return sum;
  }

  function Euclidean(v1,v2){
    return Math.sqrt(EuclideanSq(v1,v2));
  }

  function Manhattan(v1,v2){
    var sum = 0;
    v1.forEach(function(d,i){
      sum += Math.abs(d-v2[i]);;
    })
    return sum;
  }

  function MaxDist(v1,v2){
    var max = 0;
    v1.forEach(function(d,i){
      max = Math.max(Math.abs(d-v2[i]),max);
    })
    return max;
  }

  function Hamming(s1,s2){
    if (s1.length != s2.length) return -1;
    
    var dist = 0;
    
    for (var i=0, len=s1.length; i<len; ++i){
      if (a[i] !== b[i]) dist += 1;
    }
    
    return dist;
  }

  function Levenshtein(s1,s2){
      if (s1 == s2) return 0;
      if (s1.length == 0) return s2.length;
      if (s2.length == 0) return s1.length;
   
    var v0 = new Array(s2.length+1),
      v1 = new Array(s2.length+1);
      
    for (var i=0,len=v0.length; i<len; ++i){
      v0[i] = i;
    }
    
    for (var i=0,len=s1.length; i<len; ++i){
      v1[0] = i + 1;
      for (var j = 0,len2=s2.length; j < len2; ++j){
              var cost = (s1[i] == s2[j]) ? 0 : 1;
              v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      
      for (var j = 0,len2=v0.length; j < len2; ++j){
        v0[j] = v1[j];
      }
    }
   
    return v1[s2.length];
  }

})((module)? module.exports = {} : window.AHC = {})