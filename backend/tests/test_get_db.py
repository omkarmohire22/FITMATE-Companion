from app.database import get_db
from sqlalchemy import text


def run_test():
    g = get_db()
    db = next(g)
    print('Opened session')
    try:
        # Cause an intentional SQL error
        db.execute(text('SELECT * FROM non_existing_table'))
    except Exception as e:
        print('Intentional error occurred:', type(e).__name__)
    # Close the generator to trigger finally (rollback + close)
    g.close()
    print('Generator closed, session should be rolled back and closed')

    # Now open a fresh session and run a simple query
    g2 = get_db()
    db2 = next(g2)
    try:
        res = db2.execute(text('SELECT 1')).all()
        print('Subsequent query succeeded:', res)
    finally:
        g2.close()


if __name__ == '__main__':
    run_test()
