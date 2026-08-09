---
title: "C# Exception Handling: try, catch, finally and Custom Exceptions"
description: "Learn practical C# exception handling with try, catch, finally, throw, custom exceptions, and common best practices."
layout: "layouts/base.njk"
permalink: "/csharp-exception-handling/"
date: 2026-08-09
---

<div class="article">
<div class="article-header"><p class="eyebrow">C# TUTORIALS</p><h1>C# Exception Handling: try, catch, finally and Custom Exceptions</h1><p>Exception handling lets a C# application respond to unexpected runtime conditions without abruptly terminating the entire operation.</p></div>
<div class="article-content">
<h2>Basic try and catch</h2>
<pre><code>try
{
    int value = int.Parse(input);
}
catch (FormatException)
{
    Console.WriteLine("Enter a valid number.");
}</code></pre>
<h2>Using finally</h2>
<p>The <code>finally</code> block runs after the try/catch flow and is useful for cleanup operations.</p>
<pre><code>try
{
    // Work with a resource
}
finally
{
    // Cleanup
}</code></pre>
<h2>Throwing Exceptions</h2>
<p>Use <code>throw</code> when the current method cannot continue with invalid state.</p>
<pre><code>if (amount &lt; 0)
    throw new ArgumentOutOfRangeException(nameof(amount));</code></pre>
<h2>Custom Exceptions</h2>
<pre><code>public class InsufficientBalanceException : Exception
{
    public InsufficientBalanceException(string message)
        : base(message) { }
}</code></pre>
<h2>Best Practices</h2>
<ul><li>Catch specific exceptions rather than <code>Exception</code> when possible.</li><li>Do not use exceptions for normal control flow.</li><li>Preserve the original exception when rethrowing with <code>throw;</code>.</li><li>Include useful context in application logs.</li><li>Do not expose sensitive exception details to end users.</li></ul>
<h2>Conclusion</h2>
<p>Good exception handling makes C# applications more reliable and easier to diagnose. Catch only what you can handle and allow unexpected failures to be handled at an appropriate application boundary.</p>
</div></div>
