from lark import Lark, Transformer, v_args
from z3 import Bool, And, Or, Not, Xor, If


@v_args(inline=True)  # This decorator allows passing arguments directly
class Z3Transformer(Transformer):
    def atom(self, name):
        return Bool(name)

    def and_expr(self, first, *rest):
        return And(first, *rest)

    def or_expr(self, first, *rest):
        return Or(first, *rest)

    def not_expr(self, expr):
        return Not(expr)

    def xor_expr(self, left, right):
        return Xor(left, right)

    def if_expr(self, cond, true_expr, false_expr):
        return If(cond, true_expr, false_expr)

    def variable(self, name):
        return Bool(name)


class Z3Parser:
    grammar = """
    ?start: expression

    ?expression: atom
            | and_expr
            | or_expr
            | not_expr
            | xor_expr
            | if_expr

    and_expr: "And" "(" expression ( "," expression)* ")"
    or_expr: "Or" "(" expression ( "," expression)* ")"
    not_expr: "Not" "(" expression ")"
    xor_expr: "Xor" "(" expression "," expression ")"
    if_expr: "If" "(" expression "," expression "," expression ")"

    atom: VAR -> variable

    VAR: /[a-zA-Z_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff][a-zA-Z0-9_\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*/

    %import common.WS
    %ignore WS
"""

    def __init__(self):
        self.parser = Lark(
            self.grammar, start="start", parser="lalr", transformer=Z3Transformer()
        )

    def parse(self, text):
        return self.parser.parse(text)
