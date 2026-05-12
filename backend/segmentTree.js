class SegmentTree {
  constructor(arr) {
    this.n = arr.length;
    this.tree = new Array(2 * this.n).fill(0);
    for (let i = 0; i < this.n; i++) this.tree[this.n + i] = arr[i];
    for (let i = this.n - 1; i > 0; --i) this.tree[i] = this.tree[i << 1] + this.tree[i << 1 | 1];
  }

  // Mise à jour en O(log n)
  update(i, val) {
    for (this.tree[i += this.n] = val; i > 1; i >>= 1) {
      this.tree[i >> 1] = this.tree[i] + this.tree[i ^ 1];
    }
  }

  // Requête sur intervalle [l, r) en O(log n)
  query(l, r) {
    let res = 0;
    for (l += this.n, r += this.n; l < r; l >>= 1, r >>= 1) {
      if (l & 1) res += this.tree[l++];
      if (r & 1) res += this.tree[--r];
    }
    return res;
  }
}

module.exports = SegmentTree;