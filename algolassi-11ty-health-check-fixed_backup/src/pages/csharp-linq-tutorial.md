---
title: "C# LINQ Tutorial: Filtering, Sorting, Grouping and Joining"
description: "A practical C# LINQ tutorial covering Where, Select, OrderBy, GroupBy, joins, projections, and common LINQ patterns."
layout: "layouts/base.njk"
permalink: "/csharp-linq-tutorial/"
date: 2026-08-09
---

<div class="article">
<div class="article-header"><p class="eyebrow">C# TUTORIALS</p><h1>C# LINQ Tutorial: Filtering, Sorting, Grouping and Joining</h1><p>LINQ gives C# developers a consistent way to query collections and data sources using readable expressions.</p></div>
<div class="article-content">
<h2>What Is LINQ?</h2>
<p>Language Integrated Query, or LINQ, lets you query objects and many other data sources with a common C# syntax.</p>
<h2>Filtering with Where</h2>
<pre><code>var adults = people
    .Where(p =&gt; p.Age &gt;= 18)
    .ToList();</code></pre>
<h2>Projecting with Select</h2>
<pre><code>var names = people
    .Select(p =&gt; p.Name)
    .ToList();</code></pre>
<h2>Sorting</h2>
<pre><code>var ordered = people
    .OrderBy(p =&gt; p.Name)
    .ThenByDescending(p =&gt; p.Age)
    .ToList();</code></pre>
<h2>Grouping</h2>
<pre><code>var groups = people
    .GroupBy(p =&gt; p.Department)
    .ToList();</code></pre>
<h2>Joining Collections</h2>
<pre><code>var result = employees.Join(
    departments,
    e =&gt; e.DepartmentId,
    d =&gt; d.Id,
    (e, d) =&gt; new { e.Name, Department = d.Name });</code></pre>
<h2>Deferred Execution</h2>
<p>Many LINQ operators return an enumerable that is evaluated when it is enumerated. Calling methods such as <code>ToList()</code> materializes the result immediately.</p>
<h2>Best Practices</h2>
<ul><li>Keep LINQ expressions readable.</li><li>Avoid unnecessarily complex query chains.</li><li>Use <code>Any()</code> when you only need to know whether a match exists.</li><li>Use <code>FirstOrDefault()</code> when absence is a valid result.</li><li>Be aware of deferred execution and repeated enumeration.</li></ul>
<h2>Conclusion</h2>
<p>LINQ is one of the most useful features in modern C#. Once you understand filtering, projection, ordering, grouping, and joins, you can write concise and expressive data-processing code.</p>
</div></div>
